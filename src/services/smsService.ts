/**
 * AgriSense Real SMS Dispatch & Communication Service
 * Connects to Africa's Talking / Twilio backend gateway, validates Uganda
 * cellular numbers, checks farmer consent, and logs real dispatches to Cloud Firestore.
 */

import type { SupportedLanguage } from "../context/LanguageContext";
import { authenticatedFetch } from "./authenticatedFetch";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export type SmsDeliveryStatus =
  | "DELIVERED"
  | "SENT"
  | "PENDING"
  | "GATEWAY_NOT_CONFIGURED_QUEUED"
  | "FAILED";

export interface SmsMessage {
  id: string;
  recipientPhone: string;
  farmerName: string;
  farmName: string;
  messageText: string;
  characterCount: number;
  networkCarrier: "MTN Uganda" | "Airtel Uganda";
  status: SmsDeliveryStatus;
  statusDetail?: string;
  costUgx: number;
  timestamp: string;
  category: "DROUGHT_RISK" | "IRRIGATION" | "DISEASE_ALERT" | "WEATHER_WARNING" | "BCTB_EARLY_WARNING";
  farmerUid?: string | null;
}

const SMS_STORAGE_KEY = "agrisense_sms_dispatches_v2";

/** Validates whether a phone number matches Ugandan cellular format */
export function isValidUgandaPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, "");
  return /^(\+256|0)(7[045678]\d{7})$/.test(cleaned);
}

/** Normalizes a phone number to standard international +2567XXXXXXXX format */
export function normalizeUgandaPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, "");
  if (cleaned.startsWith("07") && cleaned.length === 10) {
    return "+256" + cleaned.slice(1);
  }
  if (cleaned.startsWith("256") && cleaned.length === 12) {
    return "+" + cleaned;
  }
  return cleaned;
}

/** Detects Uganda network carrier based on prefix */
export function detectUgandaCarrier(phone: string): "MTN Uganda" | "Airtel Uganda" {
  const norm = normalizeUgandaPhone(phone);
  const prefix = norm.slice(4, 6);
  return ["77", "78", "76"].includes(prefix) ? "MTN Uganda" : "Airtel Uganda";
}

/** Formats a localized SMS message adhering strictly to GSM-7 160-char budget */
export function buildLocalizedSmsMessage(
  farmerName: string,
  farmName: string,
  shortAdvice: string,
  lang: SupportedLanguage = "en"
): string {
  let text = "";
  if (lang === "lg") {
    text = `[AgriSense Alert] ${farmerName}, ${shortAdvice}. Omusiri: ${farmName}. Kebera amatabi mangu.`;
  } else if (lang === "sw") {
    text = `[AgriSense Alert] ${farmerName}, ${shortAdvice}. Shamba: ${farmName}. Chunguza matawi mara moja.`;
  } else if (lang === "nyn") {
    text = `[AgriSense Alert] ${farmerName}, ${shortAdvice}. Omusiri: ${farmName}. Taaha ogume orebe amataama.`;
  } else {
    text = `[AgriSense Alert] ${farmerName}: ${shortAdvice} on ${farmName}. Inspect twigs immediately.`;
  }

  // Ensure GSM-7 standard 160 character limit
  if (text.length > 160) {
    return text.substring(0, 157) + "...";
  }
  return text;
}

/**
 * Loads real dispatch logs from Firestore for the current user/officer
 */
export async function getLiveSmsDispatchLogs(): Promise<SmsMessage[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return getLocalSmsDispatchLogs();

  try {
    const q = query(
      collection(db, "smsDispatches"),
      where("senderUid", "==", uid),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => {
        const data = d.data();
        const ts =
          data.timestamp && typeof data.timestamp.toDate === "function"
            ? data.timestamp.toDate().toISOString()
            : typeof data.timestamp === "string"
              ? data.timestamp
              : new Date().toISOString();

        return {
          id: d.id,
          recipientPhone: data.recipientPhone || "",
          farmerName: data.farmerName || "",
          farmName: data.farmName || "",
          messageText: data.messageText || "",
          characterCount: data.characterCount || 0,
          networkCarrier: data.networkCarrier || "MTN Uganda",
          status: (data.status as SmsDeliveryStatus) || "PENDING",
          statusDetail: data.statusDetail,
          costUgx: data.costUgx || 0,
          timestamp: ts,
          category: data.category || "BCTB_EARLY_WARNING",
          farmerUid: data.farmerUid,
        };
      });
    }
  } catch (err) {
    console.warn("Could not load Firestore SMS logs; reading local cache", err);
  }

  return getLocalSmsDispatchLogs();
}

/** Local cache reader for immediate synchronous display */
export function getLocalSmsDispatchLogs(): SmsMessage[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(SMS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SmsMessage[]) : [];
  } catch {
    return [];
  }
}

/**
 * Dispatches an SMS alert through the secure backend Cloud Function.
 */
export async function sendRealSmsAlert(params: {
  recipientPhone: string;
  farmerName: string;
  farmName: string;
  category: "DROUGHT_RISK" | "IRRIGATION" | "DISEASE_ALERT" | "WEATHER_WARNING" | "BCTB_EARLY_WARNING";
  shortAdvice: string;
  lang?: SupportedLanguage;
  farmerId?: string;
}): Promise<SmsMessage> {
  const normalizedPhone = normalizeUgandaPhone(params.recipientPhone);
  if (!isValidUgandaPhone(normalizedPhone)) {
    throw new Error("Invalid Ugandan cellular phone format (+256 7XX XXX XXX).");
  }

  const messageText = buildLocalizedSmsMessage(
    params.farmerName,
    params.farmName,
    params.shortAdvice,
    params.lang || "en"
  );
  const carrier = detectUgandaCarrier(normalizedPhone);

  const response = await authenticatedFetch("/api/sendSmsNotification", {
    method: "POST",
    body: JSON.stringify({
      recipientPhone: normalizedPhone,
      farmerName: params.farmerName,
      farmName: params.farmName,
      messageText,
      category: params.category,
      farmerId: params.farmerId,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    dispatchId?: string;
    status?: SmsDeliveryStatus;
    statusDetail?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || `SMS gateway dispatch failed (HTTP ${response.status}).`);
  }

  const newSms: SmsMessage = {
    id: payload.dispatchId || `SMS-UG-${Date.now()}`,
    recipientPhone: normalizedPhone,
    farmerName: params.farmerName,
    farmName: params.farmName,
    messageText,
    characterCount: messageText.length,
    networkCarrier: carrier,
    status: payload.status || "GATEWAY_NOT_CONFIGURED_QUEUED",
    statusDetail: payload.statusDetail,
    costUgx: payload.status === "SENT" ? 50 : 0,
    timestamp: new Date().toISOString(),
    category: params.category,
    farmerUid: params.farmerId,
  };

  // Cache locally
  try {
    const logs = getLocalSmsDispatchLogs();
    logs.unshift(newSms);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));
    }
  } catch (err) {
    console.warn("Could not cache SMS dispatch", err);
  }

  return newSms;
}

/** Legacy-compatible synchronous wrapper */
export function sendSmsAlert(
  recipientPhone: string,
  farmerName: string,
  farmName: string,
  category: "DROUGHT_RISK" | "IRRIGATION" | "DISEASE_ALERT" | "WEATHER_WARNING",
  shortAdvice: string,
  lang: SupportedLanguage = "en"
): SmsMessage {
  const normalized = normalizeUgandaPhone(recipientPhone);
  const carrier = detectUgandaCarrier(normalized);
  const messageText = buildLocalizedSmsMessage(farmerName, farmName, shortAdvice, lang);

  const initialRecord: SmsMessage = {
    id: `SMS-UG-${Date.now()}`,
    recipientPhone: normalized,
    farmerName,
    farmName,
    messageText,
    characterCount: messageText.length,
    networkCarrier: carrier,
    status: "PENDING",
    costUgx: 0,
    timestamp: new Date().toISOString(),
    category,
  };

  // Fire async dispatch in background
  void sendRealSmsAlert({
    recipientPhone: normalized,
    farmerName,
    farmName,
    category,
    shortAdvice,
    lang,
  }).catch((err) => {
    console.warn("Background SMS dispatch attempt failed", err);
  });

  return initialRecord;
}

export function getSmsDispatchLogs(): SmsMessage[] {
  return getLocalSmsDispatchLogs();
}
