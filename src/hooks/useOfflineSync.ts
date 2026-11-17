import { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { getOfflineQueue, isNetworkOnline, subscribeToSyncStatus, syncOfflineQueueToCloud, syncResearchPredictionQueue } from "../services/offlineSyncService";
import { getResearchPredictionQueue } from "../services/storage/indexedDbService";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(isNetworkOnline());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const refresh = () => setIsOnline(isNetworkOnline());
    const refreshPending = async () => {
      const userId = auth.currentUser?.uid;
      const research = userId ? await getResearchPredictionQueue(userId) : [];
      setPendingCount(getOfflineQueue().length + research.filter((item) => !item.synced).length);
    };
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    const unsubscribe = subscribeToSyncStatus(({ isOnline: online, pendingCount: pending }) => {
      setIsOnline(online);
      setPendingCount(pending);
      void refreshPending();
    }, auth.currentUser?.uid);
    window.addEventListener("agrisense:offline-queue-updated", refreshPending);
    if (navigator.onLine) {
      void syncOfflineQueueToCloud();
      void syncResearchPredictionQueue();
    }
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("agrisense:offline-queue-updated", refreshPending);
      unsubscribe();
    };
  }, []);

  async function syncNow() {
    const results = await Promise.all([syncOfflineQueueToCloud(), syncResearchPredictionQueue()]);
    const userId = auth.currentUser?.uid;
    const research = userId ? await getResearchPredictionQueue(userId) : [];
    setPendingCount(results[0].remainingCount + research.filter((item) => !item.synced).length);
    return { syncedCount: results[0].syncedCount + results[1].syncedCount, remainingCount: results[0].remainingCount + results[1].remainingCount };
  }

  return { isOnline, pendingCount, syncNow };
}
