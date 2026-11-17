/**
 * In-App Notification Service
 * Manages user-scoped persistent notifications in Cloud Firestore.
 */

import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: "BCTB_EARLY_WARNING" | "WEATHER_ALERT" | "EXTENSION_REFERRAL" | "COMMUNITY";
  isRead: boolean;
  createdAt: string;
}

export async function getUserNotifications(): Promise<AppNotification[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(25)
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      const createdAt =
        data.createdAt && typeof data.createdAt.toDate === "function"
          ? data.createdAt.toDate().toISOString()
          : typeof data.createdAt === "string"
            ? data.createdAt
            : new Date().toISOString();

      return {
        id: docSnap.id,
        userId: data.userId,
        title: data.title || "Notification",
        message: data.message || "",
        category: data.category || "BCTB_EARLY_WARNING",
        isRead: Boolean(data.isRead),
        createdAt,
      };
    });
  } catch (err) {
    console.warn("Could not load notifications from Firestore", err);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || !notificationId) return;

  try {
    const ref = doc(db, "notifications", notificationId);
    await updateDoc(ref, {
      isRead: true,
      readAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Could not mark notification as read", err);
  }
}

