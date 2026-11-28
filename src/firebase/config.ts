import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const useFirebaseEmulators = import.meta.env.DEV
  && import.meta.env.VITE_USE_FIREBASE_EMULATORS !== "false";
const localProjectId = "demo-agrisense-local";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: useFirebaseEmulators ? localProjectId : import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: useFirebaseEmulators
    ? `${localProjectId}.appspot.com`
    : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value || value === "YOUR_API_KEY")
  .map(([key]) => key);

if (missingConfig.length > 0) {
  console.warn(`Firebase is not configured. Missing values: ${missingConfig.join(", ")}`);
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Keep previously read farmer data and queued Firestore writes available across
// reloads while offline. The multi-tab manager keeps browser tabs in sync.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const storage = getStorage(app);

if (useFirebaseEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}

export default app;
