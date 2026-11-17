import { auth } from "../firebase/config";
import type { UserRole } from "../types/user";

type AdminDecision = "APPROVE" | "REJECT";

async function postAdminAction(
  endpoint: string,
  payload: Record<string, string>,
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in with an administrator account to continue.");

  const token = await currentUser.getIdToken();
  const response = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "The administrator action could not be completed.");
  }
}

export function reviewOfficerApplication(
  applicationId: string,
  decision: AdminDecision,
): Promise<void> {
  return postAdminAction("reviewOfficerApplication", { applicationId, decision });
}

export function reviewSubscriptionRequest(
  requestId: string,
  decision: AdminDecision,
): Promise<void> {
  return postAdminAction("reviewSubscriptionRequest", { requestId, decision });
}

export function updateUserAccess(
  email: string,
  role: UserRole,
  status: "ACTIVE" | "INACTIVE",
): Promise<void> {
  return postAdminAction("updateUserAccess", { email, role, status });
}
