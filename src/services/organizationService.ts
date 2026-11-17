import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import type { Organization, OrganizationMember } from "../types/organization";

export async function getOrganizationDetails(orgId: string): Promise<Organization | null> {
  if (!orgId) return null;
  const snapshot = await getDoc(doc(db, "organizations", orgId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Organization;
}

export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
  if (!orgId) return [];
  const q = query(collection(db, "users"), where("organizationId", "==", orgId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      fullName: data.fullName || "Member",
      email: data.email || "",
      phone: data.phone || "",
      role: data.role || "FARMER",
      assignedDistrict: data.assignedDistrict,
      assignedSubCounty: data.assignedSubCounty,
      joinedAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
    };
  });
}

export async function addOrganizationMember(email: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in with an organization administrator account to continue.");

  const token = await currentUser.getIdToken();
  const response = await fetch("/api/assignOrganizationMember", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "The member could not be added.");
  }
}
