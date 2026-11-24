import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const QUEUE_KEY = "agrisense_feedback_queue";

export interface FeedbackPayload {
  userId: string | null;
  rating: number | null;
  category: string;
  message: string;
  contact: string | null;
  appVersion: string;
}

export interface QueuedFeedback extends FeedbackPayload {
  queueId: string;
  createdAt: string;
}

export function getFeedbackQueue(): QueuedFeedback[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as QueuedFeedback[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedFeedback[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(0, 100)));
  } catch {
    // Local storage may be unavailable; the current session still works.
  }
}

export function queueFeedback(payload: FeedbackPayload): void {
  const item: QueuedFeedback = {
    ...payload,
    queueId: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  saveQueue([item, ...getFeedbackQueue()]);
}

export async function syncFeedbackQueue(): Promise<number> {
  const queue = getFeedbackQueue();
  if (!queue.length) return 0;

  const remaining: QueuedFeedback[] = [];
  let synced = 0;
  for (const item of queue) {
    try {
      await addDoc(collection(db, "feedback"), {
        userId: item.userId ?? auth.currentUser?.uid ?? null,
        rating: item.rating,
        category: item.category,
        message: item.message,
        contact: item.contact,
        createdAt: item.createdAt,
        appVersion: item.appVersion,
      });
      synced++;
    } catch {
      remaining.push(item);
    }
  }
  if (synced) saveQueue(remaining);
  return synced;
}

export async function submitFeedback(payload: FeedbackPayload): Promise<"sent" | "queued"> {
  if (!navigator.onLine) {
    queueFeedback(payload);
    return "queued";
  }

  try {
    await addDoc(collection(db, "feedback"), {
      ...payload,
      userId: payload.userId ?? auth.currentUser?.uid ?? null,
      createdAt: new Date().toISOString(),
    });
    return "sent";
  } catch {
    queueFeedback(payload);
    return "queued";
  }
}

export function setupFeedbackSync(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const flush = () => {
    if (navigator.onLine) void syncFeedbackQueue();
  };

  flush();
  window.addEventListener("online", flush);
  const timer = window.setInterval(flush, 60_000);

  return () => {
    window.removeEventListener("online", flush);
    window.clearInterval(timer);
  };
}