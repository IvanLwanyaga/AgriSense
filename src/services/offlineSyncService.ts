import { ref, uploadString } from "firebase/storage";
import { auth, storage } from "../firebase/config";
import type { BctbAssessmentInput, BctbRiskResult } from "../types/bctb";
import { authenticatedFetch } from "./authenticatedFetch";

const OFFLINE_QUEUE_KEY = "agrisense_offline_assessments_queue";

import {
  enqueueOfflineAssessment,
  getScopedOfflineQueue,
  updateQueueItemStatus,
  removeQueueItem,
  saveAssessmentToHistory,
  type SyncState,
  type QueuedOfflineAssessment,
  enqueueResearchPrediction,
  getResearchPredictionQueue,
  updateResearchPredictionQueue,
} from "./storage/indexedDbService";
import { predictResearchBctbRisk } from "./researchBctbModelService";
import { buildLocalResearchPredictionFromInputs } from "./localBctbPrediction";
import type { ResearchBctbModelInputs, ResearchBctbPrediction } from "../types/bctb";

export type { SyncState };

export interface QueuedAssessment {
  id: string;
  assessment: Partial<BctbAssessmentInput>;
  riskResult: BctbRiskResult;
  timestamp: string;
  synced: boolean;
  status: SyncState;
  retryCount?: number;
  error?: string;
}

// Check network connectivity
export function isNetworkOnline(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
    ? navigator.onLine
    : true;
}

// Get all unsynced assessments from local queue (sync wrapper for legacy and UI)
export function getOfflineQueue(): QueuedAssessment[] {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${OFFLINE_QUEUE_KEY}_${userId}`);
    const queue: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(queue) ? (queue as QueuedAssessment[]) : [];
  } catch (err) {
    console.warn("Could not read offline queue", err);
    return [];
  }
}

export async function getOfflineQueueAsync(): Promise<QueuedOfflineAssessment[]> {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];
  return getScopedOfflineQueue(userId);
}

// Queue an assessment while offline
export function queueAssessmentForSync(
  assessment: Partial<BctbAssessmentInput>,
  riskResult: BctbRiskResult
): QueuedAssessment {
  const userId = assessment.farmerId;
  if (!userId || userId !== auth.currentUser?.uid) {
    throw new Error("Sign in to save this screening to your private sync queue.");
  }

  const queuedItem: QueuedAssessment = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    assessment,
    riskResult,
    timestamp: new Date().toISOString(),
    synced: false,
    status: "WAITING_TO_SYNC",
    retryCount: 0,
  };

  // Save to IndexedDB
  void enqueueOfflineAssessment(userId, assessment, riskResult, queuedItem.id);

  // Sync cache for immediate UI read
  const queue = getOfflineQueue();
  queue.unshift(queuedItem);
  try {
    localStorage.setItem(`${OFFLINE_QUEUE_KEY}_${userId}`, JSON.stringify(queue));
  } catch (err) {
    console.error("Could not write to offline queue cache", err);
  }

  notifySyncListeners();
  return queuedItem;
}

export async function queueResearchPrediction(userId: string, inputs: ResearchBctbModelInputs) {
  const item = await enqueueResearchPrediction(userId, inputs);
  notifyOfflineQueueChanged();
  return item;
}

let researchSyncInFlight: Promise<{ syncedCount: number; remainingCount: number }> | null = null;
export function syncResearchPredictionQueue() {
  if (researchSyncInFlight) return researchSyncInFlight;
  researchSyncInFlight = (async () => {
    const userId = auth.currentUser?.uid;
    if (!userId || !isNetworkOnline()) return { syncedCount: 0, remainingCount: 0 };
    const queue = await getResearchPredictionQueue(userId);
    let syncedCount = 0;
    for (const item of queue.filter((entry) => !entry.synced).sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      if (auth.currentUser?.uid !== userId) break;
      try {
        let result: ResearchBctbPrediction;
        try {
          result = await predictResearchBctbRisk(item.inputs);
        } catch (predictionError) {
          console.warn(
            "Prediction service unavailable during sync; using the local AgriSense rule engine.",
            predictionError,
          );
          result = buildLocalResearchPredictionFromInputs(item.inputs);
        }
        await updateResearchPredictionQueue({ ...item, synced: true, result, error: undefined });
        window.dispatchEvent(new CustomEvent("agrisense:research-prediction-synced", { detail: { userId, id: item.id, result } }));
        syncedCount += 1;
      } catch (error) {
        await updateResearchPredictionQueue({ ...item, error: error instanceof Error ? error.message : "Sync failed" });
        break;
      }
    }
    notifyOfflineQueueChanged();
    return { syncedCount, remainingCount: queue.filter((entry) => !entry.synced).length - syncedCount };
  })().finally(() => { researchSyncInFlight = null; });
  return researchSyncInFlight;
}

function notifyOfflineQueueChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("agrisense:offline-queue-updated"));
}

// Sync all queued items to Firebase Firestore
let syncInFlight: Promise<{ syncedCount: number; remainingCount: number }> | null = null;

export function syncOfflineQueueToCloud(): Promise<{
  syncedCount: number;
  remainingCount: number;
}> {
  if (syncInFlight) return syncInFlight;
  syncInFlight = syncPendingQueue().finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}

async function syncPendingQueue(): Promise<{
  syncedCount: number;
  remainingCount: number;
}> {
  const user = auth.currentUser;
  if (!user) return { syncedCount: 0, remainingCount: 0 };
  if (!isNetworkOnline()) {
    return { syncedCount: 0, remainingCount: getOfflineQueue().length };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, remainingCount: 0 };
  }

  let syncedCount = 0;
  const remaining: QueuedAssessment[] = [];

  for (const item of queue) {
    try {
      if (auth.currentUser?.uid !== user.uid) {
        remaining.push(item);
        continue;
      }

      const assessmentId = item.id;
      let photoPath: string | null = null;
      const photoData = item.assessment.optionalPhotoUrl;
      if (photoData) {
        const match = photoData.match(/^data:(image\/(?:jpeg|png|webp));base64,/);
        if (!match) {
          throw new Error("The saved photo is invalid. Remove it and attach the photo again.");
        }
        const extension = match[1] === "image/png" ? "png" : match[1] === "image/webp" ? "webp" : "jpg";
        photoPath = `bctb_reference_photos/${user.uid}/${assessmentId}/reference.${extension}`;
        await uploadString(ref(storage, photoPath), photoData, "data_url", {
          contentType: match[1],
        });
      }

      const assessmentFields: Record<string, unknown> = { ...item.assessment };
      delete assessmentFields.optionalPhotoUrl;
      const riskResult: Record<string, unknown> = { ...item.riskResult };
      delete riskResult.optionalPhotoUrl;
      const response = await authenticatedFetch("/api/submitBctbAssessment", {
        method: "POST",
        body: JSON.stringify({
          queueId: assessmentId,
          assessment: {
            ...assessmentFields,
            farmerId: user.uid,
            optionalPhotoUrl: photoPath,
            offlineCreatedAt: item.timestamp,
            clientModifiedAt: item.timestamp,
          },
          riskResult,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || `Could not sync assessment (HTTP ${response.status}).`);
      }

      // Remove from IndexedDB queue and record to history
      await removeQueueItem(user.uid, item.id);
      await saveAssessmentToHistory(user.uid, {
        id: item.id,
        userId: user.uid,
        farmId: item.assessment.farmId,
        assessment: item.assessment,
        riskResult: item.riskResult,
        syncStatus: "SYNCED",
        syncedAt: new Date().toISOString(),
        createdAt: item.timestamp,
      });

      syncedCount++;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Sync failed";
      console.error("Could not sync assessment; retaining it on this device:", err);
      item.status = "SYNC_FAILED";
      item.retryCount = (item.retryCount || 0) + 1;
      item.error = errorMsg;
      await updateQueueItemStatus(user.uid, item.id, "SYNC_FAILED", errorMsg);
      remaining.push(item);
    }
  }

  try {
    localStorage.setItem(`${OFFLINE_QUEUE_KEY}_${user.uid}`, JSON.stringify(remaining));
  } catch (err) {
    console.error("Could not update queue after sync", err);
  }

  notifySyncListeners();
  return { syncedCount, remainingCount: remaining.length };
}

// Reactive listeners
type SyncCallback = (status: { isOnline: boolean; pendingCount: number }) => void;
const listeners = new Map<SyncCallback, string | undefined>();

export function subscribeToSyncStatus(
  callback: SyncCallback,
  userId = auth.currentUser?.uid
): () => void {
  listeners.set(callback, userId);
  // initial call
  callback({ isOnline: isNetworkOnline(), pendingCount: getOfflineQueue().length });

  return () => {
    listeners.delete(callback);
  };
}

function notifySyncListeners() {
  const isOnline = isNetworkOnline();
  listeners.forEach((userId, callback) => {
    const pendingCount = userId && userId === auth.currentUser?.uid
      ? getOfflineQueue().length
      : 0;
    callback({ isOnline, pendingCount });
  });
}

// Auto-register window event listeners
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("Internet reconnected! Triggering auto-sync of offline assessments...");
    notifySyncListeners();
    syncOfflineQueueToCloud().then(({ syncedCount }) => {
      if (syncedCount > 0) {
        console.log(`Successfully synced ${syncedCount} assessments to cloud.`);
      }
    }).catch((error: unknown) => {
      console.error("Automatic assessment sync failed; queued records were retained.", error);
    });
    void syncResearchPredictionQueue();
  });

  window.addEventListener("offline", () => {
    console.log("Device switched to offline mode.");
    notifySyncListeners();
  });
}
