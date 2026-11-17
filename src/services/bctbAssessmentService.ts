import type { BctbAssessmentInput, BctbRiskResult } from "../types/bctb";
import type { FollowUpCase, FollowUpStatus, VerifiedObservationStatus } from "../types/followUp";
import { auth, db } from "../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { authenticatedFetch } from "./authenticatedFetch";

const LEGACY_DRAFT_KEY = "agrisense_bctb_draft_assessment";
const LEGACY_HISTORY_KEY = "agrisense_bctb_assessment_history";

function getUserScopedStorageKey(prefix: string, uid: string): string {
  return uid ? `${prefix}_${uid}` : prefix;
}

function migrateLegacyStorageValue(uid: string, legacyKey: string, targetKey: string): string | null {
  if (!uid || typeof localStorage === "undefined") return null;

  const targetValue = localStorage.getItem(targetKey);
  const legacyValue = localStorage.getItem(legacyKey);
  if (!legacyValue) return targetValue;
  if (!targetValue) {
    localStorage.setItem(targetKey, legacyValue);
  }
  localStorage.removeItem(legacyKey);
  return targetValue || legacyValue;
}

// --- Draft Management ---

import {
  saveScopedDraft,
  loadScopedDraft,
  clearScopedDraft,
  saveAssessmentToHistory,
  getScopedAssessmentHistory,
} from "./storage/indexedDbService";
import type { StructuredInspection } from "../types/followUp";

// --- Draft Management (User-Scoped IndexedDB with Sync Cache) ---

export function saveAssessmentDraft(draft: Partial<BctbAssessmentInput>): void {
  const uid = auth.currentUser?.uid || "guest";
  const scopedKey = getUserScopedStorageKey("agrisense_draft", uid);
  void saveScopedDraft(uid, draft, draft.farmId);
  try {
    if (typeof localStorage !== "undefined") {
      const persisted = JSON.stringify({ draft, savedAt: new Date().toISOString() });
      localStorage.setItem(scopedKey, persisted);
      migrateLegacyStorageValue(uid, LEGACY_DRAFT_KEY, scopedKey);
    }
  } catch (err) {
    console.warn("Could not cache draft locally", err);
  }
}

export function loadAssessmentDraft(): { draft: Partial<BctbAssessmentInput>; savedAt: string } | null {
  const uid = auth.currentUser?.uid || "guest";
  const scopedKey = getUserScopedStorageKey("agrisense_draft", uid);
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(scopedKey) || migrateLegacyStorageValue(uid, LEGACY_DRAFT_KEY, scopedKey);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // Fall back to null
  }
  return null;
}

export async function loadAssessmentDraftAsync(): Promise<{ draft: Partial<BctbAssessmentInput>; savedAt: string } | null> {
  const uid = auth.currentUser?.uid || "guest";
  return loadScopedDraft(uid);
}

export function clearAssessmentDraft(): void {
  const uid = auth.currentUser?.uid || "guest";
  const scopedKey = getUserScopedStorageKey("agrisense_draft", uid);
  void clearScopedDraft(uid);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(scopedKey);
      localStorage.removeItem(LEGACY_DRAFT_KEY);
    }
  } catch (err) {
    console.warn("Could not clear assessment draft", err);
  }
}

// --- Assessment History (User-Scoped IndexedDB) ---

export function saveAssessmentRecord(result: BctbRiskResult, input?: Partial<BctbAssessmentInput>): void {
  const uid = auth.currentUser?.uid || "guest";
  const recordId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const scopedHistoryKey = getUserScopedStorageKey("agrisense_history", uid);
  void saveAssessmentToHistory(uid, {
    id: recordId,
    userId: uid,
    farmId: input?.farmId,
    assessment: input || {},
    riskResult: result,
    syncStatus: "SYNCED",
    createdAt: result.createdAt || new Date().toISOString(),
  });

  try {
    if (typeof localStorage !== "undefined") {
      const existing = getLocalAssessmentHistory();
      const updated = [result, ...existing.filter((r) => r.createdAt !== result.createdAt)];
      localStorage.setItem(scopedHistoryKey, JSON.stringify(updated.slice(0, 50)));
      migrateLegacyStorageValue(uid, LEGACY_HISTORY_KEY, scopedHistoryKey);
    }
  } catch (err) {
    console.warn("Could not persist assessment result to local storage", err);
  }
}

export function getLocalAssessmentHistory(): BctbRiskResult[] {
  const uid = auth.currentUser?.uid || "guest";
  const scopedHistoryKey = getUserScopedStorageKey("agrisense_history", uid);
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(scopedHistoryKey) || migrateLegacyStorageValue(uid, LEGACY_HISTORY_KEY, scopedHistoryKey);
      if (!raw) return [];
      return JSON.parse(raw);
    }
  } catch {
    return [];
  }
  return [];
}

export async function getAssessmentHistoryAsync(): Promise<BctbRiskResult[]> {
  const uid = auth.currentUser?.uid || "guest";
  const stored = await getScopedAssessmentHistory(uid);
  return stored.map((s) => s.riskResult);
}

// --- Follow-Up Cases Management ---

export async function getFollowUpCases(officerDistrict?: string): Promise<FollowUpCase[]> {
  const cases = collection(db, "followUps");
  const caseQuery = officerDistrict && officerDistrict !== "ALL"
    ? query(cases, where("district", "==", officerDistrict))
    : officerDistrict === "ALL"
      ? query(cases)
      : query(cases, where("farmerId", "==", auth.currentUser?.uid || ""));
  const snapshot = await getDocs(caseQuery);
  return snapshot.docs
    .map((item) => {
      const data = item.data();
      const toIso = (value: unknown) => {
        if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
          return value.toDate().toISOString();
        }
        return typeof value === "string" ? value : "";
      };
      return {
        ...data,
        id: item.id,
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
      } as FollowUpCase;
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function updateCaseStatus(
  caseId: string,
  newStatus: FollowUpStatus,
  verifiedObservation: VerifiedObservationStatus,
  noteText?: string,
  inspection?: Partial<StructuredInspection>
): Promise<void> {
  const response = await authenticatedFetch("/api/updateFollowUpCase", {
    method: "POST",
    body: JSON.stringify({
      caseId,
      status: newStatus,
      verifiedObservation,
      noteText: noteText?.trim() || "",
      inspection: inspection || undefined,
    }),
  });
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || `Could not save extension update (HTTP ${response.status}).`);
  }
}
