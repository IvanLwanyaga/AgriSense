import type { BctbAssessmentInput, ResearchBctbModelInputs, ResearchBctbPrediction } from "../types/bctb";

export interface ResearchScreeningJournalEntry {
  id: string;
  queueId?: string;
  createdAt: string;
  status: "WAITING_FOR_SYNC" | "COMPLETE";
  assessment: BctbAssessmentInput;
  modelInputs: ResearchBctbModelInputs;
  prediction?: ResearchBctbPrediction;
}

function keyFor(userId: string) {
  return `agrisense_research_screening_journal_${userId}`;
}

export function getResearchScreeningJournal(userId: string): ResearchScreeningJournalEntry[] {
  if (!userId || typeof localStorage === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(keyFor(userId)) || "[]");
    return Array.isArray(value) ? value as ResearchScreeningJournalEntry[] : [];
  } catch {
    return [];
  }
}

function write(userId: string, entries: ResearchScreeningJournalEntry[]) {
  if (!userId || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(entries.slice(0, 100)));
  } catch (error) {
    console.warn("Could not save the local field visit journal", error);
  }
}

export function saveResearchScreeningEntry(
  userId: string,
  assessment: BctbAssessmentInput,
  modelInputs: ResearchBctbModelInputs,
  prediction?: ResearchBctbPrediction,
  queueId?: string,
): ResearchScreeningJournalEntry | null {
  if (!userId) return null;
  const entry: ResearchScreeningJournalEntry = {
    id: queueId || `visit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    queueId,
    createdAt: new Date().toISOString(),
    status: prediction ? "COMPLETE" : "WAITING_FOR_SYNC",
    assessment: structuredClone(assessment),
    modelInputs: { ...modelInputs },
    prediction,
  };
  write(userId, [entry, ...getResearchScreeningJournal(userId)]);
  return entry;
}

export function updateLatestResearchScreeningPrediction(
  userId: string,
  prediction: ResearchBctbPrediction,
): ResearchScreeningJournalEntry[] {
  const entries = getResearchScreeningJournal(userId);
  if (!entries.length) return entries;
  const updated: ResearchScreeningJournalEntry[] = [
    { ...entries[0], status: "COMPLETE" as const, prediction },
    ...entries.slice(1),
  ];
  write(userId, updated);
  return updated;
}

export function completeQueuedResearchScreening(
  userId: string,
  queueId: string,
  prediction: ResearchBctbPrediction,
): ResearchScreeningJournalEntry[] {
  const entries = getResearchScreeningJournal(userId).map((entry) => entry.queueId === queueId
    ? { ...entry, status: "COMPLETE" as const, prediction }
    : entry);
  write(userId, entries);
  return entries;
}
