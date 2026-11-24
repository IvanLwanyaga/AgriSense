import { getMessaging, getToken } from "firebase/messaging";
import app from "../firebase/config";
import { authenticatedFetch } from "./authenticatedFetch";

const PUSH_TOKEN_KEY = "agrisense_push_token";

export type PushSupport = "supported" | "unsupported" | "denied" | "unconfigured";
export type PushStatus = "on" | "off" | "unsupported" | "unconfigured" | "denied";

export function getPushSupport(): PushSupport {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) return "unconfigured";
  return Notification.permission === "denied" ? "denied" : "supported";
}

export function getStoredPushToken(): string | null {
  try {
    return localStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getPushStatus(): PushStatus {
  const support = getPushSupport();
  if (support !== "supported") return support;
  return getStoredPushToken() ? "on" : "off";
}

export async function enableWebPush(): Promise<{ ok: boolean; message: string }> {
  const support = getPushSupport();
  if (support === "unsupported") {
    return { ok: false, message: "Push notifications are not supported in this browser." };
  }
  if (support === "unconfigured") {
    return {
      ok: false,
      message: "Push notifications are not configured yet. Add VITE_FIREBASE_VAPID_KEY from Firebase Console → Cloud Messaging → Web Push certificates.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, message: "Notifications are blocked. Allow them in your browser's site settings and try again." };
  }

  const registration = await navigator.serviceWorker.register("/service-worker.js");
  await navigator.serviceWorker.ready;

  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) {
    return { ok: false, message: "Could not create a push token for this device." };
  }

  const response = await authenticatedFetch("/api/pushSubscribe", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Could not register this device for push notifications.");
  }

  try {
    localStorage.setItem(PUSH_TOKEN_KEY, token);
  } catch {
    // The server-side subscription is still valid if local storage is unavailable.
  }
  return { ok: true, message: "Push notifications are enabled on this device." };
}

export async function disableWebPush(): Promise<void> {
  const token = getStoredPushToken();
  if (token) {
    await authenticatedFetch("/api/pushUnsubscribe", {
      method: "POST",
      body: JSON.stringify({ token }),
    }).catch(() => undefined);
    try {
      localStorage.removeItem(PUSH_TOKEN_KEY);
    } catch {
      // Ignore storage failures.
    }
  }

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration("/service-worker.js").catch(() => undefined);
    const subscription = registration ? await registration.pushManager.getSubscription().catch(() => null) : null;
    if (subscription) await subscription.unsubscribe().catch(() => undefined);
  }
}

export async function sendTestPush(): Promise<{ ok: boolean; message: string }> {
  const response = await authenticatedFetch("/api/pushTest", { method: "POST" });
  const payload = (await response.json().catch(() => ({}))) as { error?: string; sent?: number };
  if (!response.ok || !payload.sent) {
    throw new Error(payload.error || "No push subscription was found for this device.");
  }
  return { ok: true, message: "Test notification sent. Check your notifications." };
}