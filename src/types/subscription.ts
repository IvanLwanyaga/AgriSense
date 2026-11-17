export type SubscriptionTier = "FARMER_FREE" | "FARMER_PLUS" | "ORGANISATION";

export type SubscriptionStatus =
  | "FREE"
  | "TRIAL"
  | "ACTIVE"
  | "EXPIRED"
  | "SUSPENDED"
  | "CANCELLED";

export type SubscriptionEntitlement =
  | "BASIC_SCREENING"
  | "MULTI_FARM"
  | "ADVANCED_ANALYTICS"
  | "EXTENDED_MONITORING_HISTORY"
  | "IOT_SENSORS"
  | "DOWNLOADABLE_REPORTS"
  | "COOPERATIVE_PORTAL"
  | "AGGREGATED_SURVEILLANCE"
  | "EXTENSION_MANAGEMENT"
  | "BULK_SMS_DISPATCH";

export interface SubscriptionLimits {
  maxFarms: number; // 1 for Free, unlimited (e.g. 50) for Plus, 500 for Org
  maxFieldsPerFarm: number;
  maxAssessmentsPerMonth: number | "UNLIMITED";
  iotSensorsAllowed: boolean;
  exportReportsAllowed: boolean;
  multiUserTeamAllowed: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  badge: string;
  priceUGX: number;
  priceUSD: number;
  billingPeriod: "free_forever" | "monthly" | "annual" | "custom";
  description: string;
  limits: SubscriptionLimits;
  features: string[];
  entitlements: SubscriptionEntitlement[];
  highlight?: boolean;
}

export interface SubscriptionRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: SubscriptionTier;
  requestedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes?: string;
  organizationName?: string;
}
