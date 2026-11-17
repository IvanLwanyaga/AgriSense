
import {
  createUserWithEmailAndPassword,
  browserLocalPersistence,
  browserSessionPersistence,
  deleteUser,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signOut,
  updateProfile,
} from "firebase/auth";

import { doc, serverTimestamp, writeBatch } from "firebase/firestore";

import { auth, db } from "../firebase/config";

// Cloudflare Worker URL for email OTP requests.
const OTP_API_BASE_URL = (
  import.meta.env.VITE_OTP_API_URL || ""
).replace(/\/+$/, "");

function getOtpApiUrl(endpoint: string): string {
  if (!OTP_API_BASE_URL) {
    throw new Error("Email verification service URL is not configured.");
  }

  return `${OTP_API_BASE_URL}${endpoint}`;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  attemptsRemaining?: number;
  alreadyVerified?: boolean;
  destinationEmail?: string;
}

export interface OtpStatusResponse {
  emailVerified: boolean;
  destinationEmail: string;
  codeSent: boolean;
  expiresInSeconds: number;
  cooldownRemainingSeconds: number;
}

export async function registerUser(
  fullName: string,
  email: string,
  password: string,
  role: "FARMER" | "AGRICULTURAL_OFFICER" = "FARMER",
  district?: string,
  subCounty?: string,
  phone?: string,
  staffDetails?: { organizationName: string; staffId: string },
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const isOfficerApplication = role === "AGRICULTURAL_OFFICER";

  const userProfile = {
    uid: credential.user.uid,
    fullName,
    email,
    phone: phone || "",
    organizationId: null,
    role: "FARMER" as const,
    status: isOfficerApplication ? "PENDING" : "ACTIVE",
    emailVerified: false,
    ...(isOfficerApplication
      ? {
          requestedRole: "AGRICULTURAL_OFFICER",
          applicationStatus: "PENDING",
        }
      : {}),
    assignedDistrict: district || (isOfficerApplication ? "Mukono" : ""),
    assignedSubCounty: subCounty || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await updateProfile(credential.user, {
      displayName: fullName,
    });

    const batch = writeBatch(db);

    batch.set(doc(db, "users", credential.user.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (isOfficerApplication) {
      batch.set(doc(db, "staffApplications", credential.user.uid), {
        userId: credential.user.uid,
        fullName,
        email,
        phone: phone || "",
        requestedRole: "AGRICULTURAL_OFFICER",
        assignedDistrict: district || "Mukono",
        assignedSubCounty: subCounty || "",
        organizationName: staffDetails?.organizationName.trim() || "",
        staffId: staffDetails?.staffId.trim() || "",
        status: "PENDING",
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();

  } catch (err) {
    try {
      await deleteUser(credential.user);
    } catch {
      await signOut(auth);
    }

    throw err;
  }

  await requestEmailOtp();

  // Keep user authenticated so they land directly on the OTP verification screen.
  return credential.user;
}

// Request a six-digit email verification code.
export async function requestEmailOtp(): Promise<OtpResponse> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be signed in to request a verification code.");
  }

  const token = await currentUser.getIdToken();

  const response = await fetch(getOtpApiUrl("/sendEmailOtp"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Failed to dispatch verification code.");
  }

  return data as OtpResponse;
}

// Retrieve the current email verification status.
export async function getEmailOtpStatus(): Promise<OtpStatusResponse> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be signed in to check verification status.");
  }

  const token = await currentUser.getIdToken();

  const response = await fetch(getOtpApiUrl("/getEmailOtpStatus"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to load email verification status.");
  }

  return data as OtpStatusResponse;
}

// Submit the six-digit verification code.
export async function submitEmailOtp(code: string): Promise<OtpResponse> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be signed in to submit a verification code.");
  }

  const token = await currentUser.getIdToken();

  const response = await fetch(getOtpApiUrl("/verifyEmailOtp"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: code.trim() }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Verification failed. Check the code and try again.");
  }

  // Refresh the Firebase user and ID token after successful verification.
  await currentUser.reload();
  await currentUser.getIdToken(true);

  return data as OtpResponse;
}

// Request a verification code for a new registration email address.
export async function changeRegistrationEmailAddress(
  newEmail: string
): Promise<OtpResponse & { newEmail: string }> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be signed in to update your email.");
  }

  const token = await currentUser.getIdToken();

  const response = await fetch(getOtpApiUrl("/changeRegistrationEmail"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ newEmail: newEmail.trim() }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Failed to update email address.");
  }

  return data as OtpResponse & { newEmail: string };
}

export async function loginUser(
  email: string,
  password: string,
  rememberMe = true,
) {
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );

  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  return credential.user;
}

export async function logoutUser() {
  localStorage.removeItem("agrisense_current_profile");
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}
