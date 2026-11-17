export type UserRole =
  | "PLATFORM_ADMIN"
  | "ORG_ADMIN"
  | "FARM_MANAGER"
  | "AGRICULTURAL_OFFICER"
  | "FARMER"
  | "VIEWER";

export type SubscriptionTier = "FARMER_FREE" | "FARMER_PLUS" | "ORGANISATION";
export type SubscriptionStatus = "FREE" | "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "CANCELLED";

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  organizationId: string | null;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  emailVerified?: boolean;
  pendingEmail?: string;
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiresAt?: string;
  subscriptionActivatedAt?: unknown;
  requestedRole?: "AGRICULTURAL_OFFICER";
  applicationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  organizationName?: string;
  staffId?: string;
  assignedDistrict?: string; // For Agricultural Extension Officers
  assignedSubCounty?: string;
  assignedDistricts?: string[];
  demoAccount?: boolean;
  smsConsent?: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}
