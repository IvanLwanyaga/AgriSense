import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth, db } from "../firebase/config";
import { doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import type { UserProfile } from "../types/user";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [, setAuthRefreshVersion] = useState(0);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      setUser(currentUser);
      setProfile(null);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      let creatingDefaultProfile = false;
      unsubscribeProfile = onSnapshot(doc(db, "users", currentUser.uid), (profileSnapshot) => {
        if (profileSnapshot.exists()) {
          const storedProfile = profileSnapshot.data();
          const legacyOrganizationId = storedProfile.Id;
          const data = {
            ...storedProfile,
            uid: storedProfile.uid || storedProfile.UID || currentUser.uid,
            fullName: storedProfile.fullName || storedProfile.FullName || currentUser.displayName || "AgriSense Operator",
            email: storedProfile.email || currentUser.email || "",
            organizationId: storedProfile.organizationId
              ?? (typeof legacyOrganizationId === "string" && legacyOrganizationId !== "null"
                ? legacyOrganizationId
                : null),
          } as UserProfile;
          setProfile(data);
          localStorage.setItem("agrisense_current_profile", JSON.stringify(data));
          setLoading(false);
          return;
        }

        if (creatingDefaultProfile) return;
        creatingDefaultProfile = true;
        const defaultProf: UserProfile = {
          uid: currentUser.uid,
          fullName: currentUser.displayName || "AgriSense Operator",
          email: currentUser.email || "",
          organizationId: null,
          role: "FARMER",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const profileRef = doc(db, "users", currentUser.uid);
        void runTransaction(db, async (transaction) => {
          const currentProfile = await transaction.get(profileRef);
          if (!currentProfile.exists()) {
            transaction.set(profileRef, {
              ...defaultProf,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }).catch((error) => {
          console.warn("Unable to create the default farmer profile.", error);
          setLoading(false);
        });
      }, (error) => {
        console.warn("Unable to load the user profile from Firestore.", error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const refreshAuth = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      setUser(auth.currentUser);
      setAuthRefreshVersion((version) => version + 1);
    }
  };

  const isEmailVerified = Boolean(user?.emailVerified);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        profile,
        isEmailVerified,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
