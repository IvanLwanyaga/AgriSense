/**
 * AgriSense Durable IndexedDB Storage Service
 * Provides user-scoped, persistent offline storage for drafts, assessments,
 * the sync queue, and cached farms, preventing cross-account data leakage on shared phones.
 */

import type { BctbAssessmentInput, BctbRiskResult } from "../../types/bctb";
import type { ResearchBctbModelInputs, ResearchBctbPrediction } from "../../types/bctb";

export type SyncState = "SAVED_LOCALLY" | "WAITING_TO_SYNC" | "SYNCED" | "SYNC_FAILED";

export interface StoredDraft {
  userId: string;
  farmId?: string;
  draft: Partial<BctbAssessmentInput>;
  savedAt: string;
}

export interface StoredAssessmentRecord {
  id: string;
  userId: string;
  farmId?: string;
  assessment: Partial<BctbAssessmentInput>;
  riskResult: BctbRiskResult;
  syncStatus: SyncState;
  syncedAt?: string;
  error?: string;
  createdAt: string;
}

export interface QueuedOfflineAssessment {
  id: string; // queue_...
  userId: string;
  farmId?: string;
  assessment: Partial<BctbAssessmentInput>;
  riskResult: BctbRiskResult;
  syncStatus: SyncState;
  synced: boolean;
  retryCount: number;
  lastAttempt?: string;
  error?: string;
  createdAt: string;
}

export interface QueuedResearchPrediction {
  id: string;
  userId: string;
  inputs: ResearchBctbModelInputs;
  createdAt: string;
  synced: boolean;
  result?: ResearchBctbPrediction;
  error?: string;
}

export interface StoredNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

const DB_NAME = "agrisense_offline_db";
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

function isIndexedDbAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error("IndexedDB is not available in this environment."));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("drafts")) {
        db.createObjectStore("drafts", { keyPath: "userId" });
      }

      if (!db.objectStoreNames.contains("assessment_history")) {
        const historyStore = db.createObjectStore("assessment_history", { keyPath: "id" });
        historyStore.createIndex("by_user", "userId", { unique: false });
        historyStore.createIndex("by_created", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains("offline_queue")) {
        const queueStore = db.createObjectStore("offline_queue", { keyPath: "id" });
        queueStore.createIndex("by_user", "userId", { unique: false });
        queueStore.createIndex("by_status", "syncStatus", { unique: false });
      }

      if (!db.objectStoreNames.contains("research_queue")) {
        const researchQueue = db.createObjectStore("research_queue", { keyPath: "id" });
        researchQueue.createIndex("by_user", "userId", { unique: false });
        researchQueue.createIndex("by_synced", "synced", { unique: false });
      }

      if (!db.objectStoreNames.contains("cached_farms")) {
        const farmStore = db.createObjectStore("cached_farms", { keyPath: "id" });
        farmStore.createIndex("by_user", "userId", { unique: false });
      }

      if (!db.objectStoreNames.contains("notifications")) {
        const notificationStore = db.createObjectStore("notifications", { keyPath: "id" });
        notificationStore.createIndex("by_user", "userId", { unique: false });
        notificationStore.createIndex("by_created", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Fallback user-scoped localStorage helpers when IndexedDB is blocked or running in tests
function scopedKey(userId: string, store: string): string {
  return `agrisense_v2_${userId}_${store}`;
}

function getFallbackStore<T>(userId: string, store: string): T[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(scopedKey(userId, store));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function setFallbackStore<T>(userId: string, store: string, items: T[]): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(scopedKey(userId, store), JSON.stringify(items));
  } catch (err) {
    console.warn("Scoped localStorage write failed", err);
  }
}

/* ==================== 1. DRAFTS ==================== */

export async function saveScopedDraft(
  userId: string,
  draft: Partial<BctbAssessmentInput>,
  farmId?: string
): Promise<void> {
  if (!userId) return;
  const entry: StoredDraft = {
    userId,
    farmId,
    draft,
    savedAt: new Date().toISOString(),
  };

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      tx.objectStore("drafts").put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback to scoped localStorage
    setFallbackStore(userId, "draft", [entry]);
  }
}

export async function loadScopedDraft(
  userId: string
): Promise<{ draft: Partial<BctbAssessmentInput>; savedAt: string } | null> {
  if (!userId) return null;

  try {
    const db = await openDb();
    const entry = await new Promise<StoredDraft | undefined>((resolve, reject) => {
      const tx = db.transaction("drafts", "readonly");
      const req = tx.objectStore("drafts").get(userId);
      req.onsuccess = () => resolve(req.result as StoredDraft | undefined);
      req.onerror = () => reject(req.error);
    });
    if (entry) return { draft: entry.draft, savedAt: entry.savedAt };
  } catch {
    const items = getFallbackStore<StoredDraft>(userId, "draft");
    if (items.length > 0) return { draft: items[0].draft, savedAt: items[0].savedAt };
  }
  return null;
}

export async function clearScopedDraft(userId: string): Promise<void> {
  if (!userId) return;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      tx.objectStore("drafts").delete(userId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(scopedKey(userId, "draft"));
    }
  }
}

/* ==================== 2. OFFLINE QUEUE ==================== */

export async function enqueueOfflineAssessment(
  userId: string,
  assessment: Partial<BctbAssessmentInput>,
  riskResult: BctbRiskResult,
  id?: string,
): Promise<QueuedOfflineAssessment> {
  if (!userId) throw new Error("Sign in to queue assessments on this device.");

  const queueItem: QueuedOfflineAssessment = {
    id: id || `queue_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    userId,
    farmId: assessment.farmId,
    assessment,
    riskResult,
    syncStatus: "WAITING_TO_SYNC",
    synced: false,
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("offline_queue", "readwrite");
      tx.objectStore("offline_queue").put(queueItem);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const queue = getFallbackStore<QueuedOfflineAssessment>(userId, "queue");
    queue.unshift(queueItem);
    setFallbackStore(userId, "queue", queue);
  }

  return queueItem;
}

export async function enqueueResearchPrediction(
  userId: string,
  inputs: ResearchBctbModelInputs,
): Promise<QueuedResearchPrediction> {
  if (!userId) throw new Error("Sign in to save a screening for synchronization.");
  const item: QueuedResearchPrediction = {
    id: `research_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    inputs,
    createdAt: new Date().toISOString(),
    synced: false,
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("research_queue", "readwrite");
    tx.objectStore("research_queue").put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return item;
}

export async function getResearchPredictionQueue(userId: string): Promise<QueuedResearchPrediction[]> {
  if (!userId) return [];
  try {
    const db = await openDb();
    return await new Promise<QueuedResearchPrediction[]>((resolve, reject) => {
      const request = db.transaction("research_queue", "readonly").objectStore("research_queue").index("by_user").getAll(userId);
      request.onsuccess = () => resolve((request.result as QueuedResearchPrediction[]) || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return getFallbackStore<QueuedResearchPrediction>(userId, "research_queue");
  }
}

export async function updateResearchPredictionQueue(item: QueuedResearchPrediction): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("research_queue", "readwrite");
      tx.objectStore("research_queue").put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const items = getFallbackStore<QueuedResearchPrediction>(item.userId, "research_queue");
    const next = [item, ...items.filter((entry) => entry.id !== item.id)];
    setFallbackStore(item.userId, "research_queue", next);
  }
}

export async function getScopedOfflineQueue(userId: string): Promise<QueuedOfflineAssessment[]> {
  if (!userId) return [];

  try {
    const db = await openDb();
    return await new Promise<QueuedOfflineAssessment[]>((resolve, reject) => {
      const tx = db.transaction("offline_queue", "readonly");
      const index = tx.objectStore("offline_queue").index("by_user");
      const req = index.getAll(userId);
      req.onsuccess = () => resolve((req.result as QueuedOfflineAssessment[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return getFallbackStore<QueuedOfflineAssessment>(userId, "queue");
  }
}

export async function updateQueueItemStatus(
  userId: string,
  itemId: string,
  status: SyncState,
  errorMessage?: string
): Promise<void> {
  if (!userId || !itemId) return;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("offline_queue", "readwrite");
      const store = tx.objectStore("offline_queue");
      const req = store.get(itemId);
      req.onsuccess = () => {
        const item = req.result as QueuedOfflineAssessment | undefined;
        if (item && item.userId === userId) {
          item.syncStatus = status;
          item.lastAttempt = new Date().toISOString();
          if (status === "SYNC_FAILED") {
            item.retryCount = (item.retryCount || 0) + 1;
            item.error = errorMessage || "Sync failed";
          } else {
            item.error = undefined;
          }
          store.put(item);
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    const queue = getFallbackStore<QueuedOfflineAssessment>(userId, "queue");
    const updated = queue.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          syncStatus: status,
          lastAttempt: new Date().toISOString(),
          retryCount: status === "SYNC_FAILED" ? (item.retryCount || 0) + 1 : item.retryCount,
          error: status === "SYNC_FAILED" ? errorMessage : undefined,
        };
      }
      return item;
    });
    setFallbackStore(userId, "queue", updated);
  }
}

export async function removeQueueItem(userId: string, itemId: string): Promise<void> {
  if (!userId || !itemId) return;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("offline_queue", "readwrite");
      tx.objectStore("offline_queue").delete(itemId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const queue = getFallbackStore<QueuedOfflineAssessment>(userId, "queue");
    setFallbackStore(
      userId,
      "queue",
      queue.filter((i) => i.id !== itemId)
    );
  }
}

/* ==================== 3. ASSESSMENT HISTORY ==================== */

export async function saveAssessmentToHistory(
  userId: string,
  record: StoredAssessmentRecord
): Promise<void> {
  if (!userId || !record.id) return;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("assessment_history", "readwrite");
      tx.objectStore("assessment_history").put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const history = getFallbackStore<StoredAssessmentRecord>(userId, "history");
    const filtered = history.filter((h) => h.id !== record.id);
    filtered.unshift(record);
    setFallbackStore(userId, "history", filtered.slice(0, 50));
  }
}

export async function getScopedAssessmentHistory(
  userId: string
): Promise<StoredAssessmentRecord[]> {
  if (!userId) return [];

  try {
    const db = await openDb();
    const list = await new Promise<StoredAssessmentRecord[]>((resolve, reject) => {
      const tx = db.transaction("assessment_history", "readonly");
      const index = tx.objectStore("assessment_history").index("by_user");
      const req = index.getAll(userId);
      req.onsuccess = () => resolve((req.result as StoredAssessmentRecord[]) || []);
      req.onerror = () => reject(req.error);
    });
    return list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    const history = getFallbackStore<StoredAssessmentRecord>(userId, "history");
    return history.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
}

/* ==================== 4. NOTIFICATIONS ==================== */

export async function saveUserNotification(
  userId: string,
  notification: Omit<StoredNotification, "userId" | "createdAt"> & { createdAt?: string }
): Promise<void> {
  if (!userId) return;

  const entry: StoredNotification = {
    ...notification,
    userId,
    createdAt: notification.createdAt || new Date().toISOString(),
  };

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("notifications", "readwrite");
      tx.objectStore("notifications").put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const notifications = getFallbackStore<StoredNotification>(userId, "notifications");
    const filtered = notifications.filter((item) => item.id !== entry.id);
    filtered.unshift(entry);
    setFallbackStore(userId, "notifications", filtered.slice(0, 100));
  }
}

export async function getUserNotifications(userId: string): Promise<StoredNotification[]> {
  if (!userId) return [];

  try {
    const db = await openDb();
    const list = await new Promise<StoredNotification[]>((resolve, reject) => {
      const tx = db.transaction("notifications", "readonly");
      const index = tx.objectStore("notifications").index("by_user");
      const req = index.getAll(userId);
      req.onsuccess = () => resolve((req.result as StoredNotification[]) || []);
      req.onerror = () => reject(req.error);
    });
    return list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    const notifications = getFallbackStore<StoredNotification>(userId, "notifications");
    return notifications.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  if (!userId || !notificationId) return;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("notifications", "readwrite");
      const store = tx.objectStore("notifications");
      const req = store.get(notificationId);
      req.onsuccess = () => {
        const notification = req.result as StoredNotification | undefined;
        if (notification && notification.userId === userId) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          store.put(notification);
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    const notifications = getFallbackStore<StoredNotification>(userId, "notifications");
    setFallbackStore(
      userId,
      "notifications",
      notifications.map((item) =>
        item.id === notificationId
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item
      )
    );
  }
}

