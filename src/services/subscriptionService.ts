import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { UserProfile } from "../types/user";
import type {
  SubscriptionTier,
  SubscriptionPlan,
  SubscriptionEntitlement,
  SubscriptionRequest,
} from "../types/subscription";

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  FARMER_FREE: {
    id: "FARMER_FREE",
    name: "Farmer Free",
    tagline: "Essential decision support for individual smallholders",
    badge: "Free Forever",
    priceUGX: 0,
    priceUSD: 0,
    billingPeriod: "free_forever",
    description: "Designed for Ugandan Robusta coffee smallholders to monitor BCTB twig borer risk, obtain AI explanations, and practice integrated pest management.",
    limits: {
      maxFarms: 1,
      maxFieldsPerFarm: 4,
      maxAssessmentsPerMonth: "UNLIMITED",
      iotSensorsAllowed: false,
      exportReportsAllowed: false,
      multiUserTeamAllowed: false,
    },
    features: [
      "1 Farm registration with GPS coordinates",
      "Full BCTB risk screening engine with SHAP explainability",
      "Actionable cultural management recommendations",
      "Live farm weather metrics & rainfall alerts",
      "Luganda audio translation & voice input support",
      "Community Coffee Help Room access",
    ],
    entitlements: ["BASIC_SCREENING"],
  },

  FARMER_PLUS: {
    id: "FARMER_PLUS",
    name: "Farmer Plus",
    tagline: "Commercial decision support with multi-farm management & IoT",
    badge: "Popular for Commercial Growers",
    priceUGX: 35000,
    priceUSD: 10,
    billingPeriod: "monthly",
    description: "For progressive farmers, progressive outgrowers, and commercial estates requiring multi-plot surveillance, sensor telemetry, and exportable certificates.",
    limits: {
      maxFarms: 20,
      maxFieldsPerFarm: 20,
      maxAssessmentsPerMonth: "UNLIMITED",
      iotSensorsAllowed: true,
      exportReportsAllowed: true,
      multiUserTeamAllowed: false,
    },
    features: [
      "Up to 20 distinct farms or outgrower blocks",
      "Advanced risk trend analytics and predictive forecasting",
      "Extended 24-month screening history with CSV export",
      "IoT soil moisture and canopy microclimate telemetry integration",
      "Downloadable Coffee Passport & phytosanitary audit certificates",
      "Priority triage with local district extension officers",
    ],
    entitlements: [
      "BASIC_SCREENING",
      "MULTI_FARM",
      "ADVANCED_ANALYTICS",
      "EXTENDED_MONITORING_HISTORY",
      "IOT_SENSORS",
      "DOWNLOADABLE_REPORTS",
    ],
    highlight: true,
  },

  ORGANISATION: {
    id: "ORGANISATION",
    name: "Organisation & Cooperative",
    tagline: "Aggregated surveillance, extension coordination & outgrower management",
    badge: "Cooperatives & Agribusinesses",
    priceUGX: 250000,
    priceUSD: 70,
    billingPeriod: "monthly",
    description: "For coffee cooperatives, exporter outgrower schemes, and agricultural NGOs managing hundreds of farmers across Ugandan districts.",
    limits: {
      maxFarms: 500,
      maxFieldsPerFarm: 50,
      maxAssessmentsPerMonth: "UNLIMITED",
      iotSensorsAllowed: true,
      exportReportsAllowed: true,
      multiUserTeamAllowed: true,
    },
    features: [
      "Multi-tenant cooperative and union portal",
      "Support for up to 500 smallholder farmers and extension agents",
      "District-wide aggregated BCTB risk heatmaps and outbreak detection",
      "Extension officer farm inspection assignment & case follow-up",
      "Bulk SMS advisory broadcasting across sub-counties",
      "EUDR-compliant coffee traceability and deforestation compliance audit logs",
    ],
    entitlements: [
      "BASIC_SCREENING",
      "MULTI_FARM",
      "ADVANCED_ANALYTICS",
      "EXTENDED_MONITORING_HISTORY",
      "IOT_SENSORS",
      "DOWNLOADABLE_REPORTS",
      "COOPERATIVE_PORTAL",
      "AGGREGATED_SURVEILLANCE",
      "EXTENSION_MANAGEMENT",
      "BULK_SMS_DISPATCH",
    ],
  },
};

/**
 * Returns all available subscription plans.
 */
export function getSubscriptionPlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS);
}

/**
 * Resolves the effective subscription tier for a user.
 */
export function getUserSubscriptionTier(profile: UserProfile | null): SubscriptionTier {
  if (!profile) return "FARMER_FREE";

  if (profile.role === "PLATFORM_ADMIN") {
    return "ORGANISATION";
  }

  const activeStatuses = ["ACTIVE", "TRIAL", "FREE"];
  if (profile.subscriptionStatus && !activeStatuses.includes(profile.subscriptionStatus)) {
    return "FARMER_FREE";
  }
  if (profile.subscriptionExpiresAt) {
    const expiresAt = Date.parse(profile.subscriptionExpiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return "FARMER_FREE";
  }

  if (profile.role === "ORG_ADMIN") {
    return "ORGANISATION";
  }

  // If user belongs to an active cooperative/organization, they inherit organization entitlements
  if (profile.organizationId) {
    return "ORGANISATION";
  }

  // Explicit user subscription tier
  if (profile.subscriptionTier && profile.subscriptionTier in SUBSCRIPTION_PLANS) {
    // Check if status is active or trial
    if (!profile.subscriptionStatus || ["ACTIVE", "TRIAL", "FREE"].includes(profile.subscriptionStatus)) {
      return profile.subscriptionTier;
    }
  }

  return "FARMER_FREE";
}

/**
 * Checks whether a user is entitled to a specific capability.
 */
export function hasEntitlement(
  profile: UserProfile | null,
  entitlement: SubscriptionEntitlement
): boolean {
  const tier = getUserSubscriptionTier(profile);
  const plan = SUBSCRIPTION_PLANS[tier];
  return plan ? plan.entitlements.includes(entitlement) : false;
}

/**
 * Checks whether a user can register an additional farm based on their subscription limits.
 */
export function canAddFarm(
  currentFarmCount: number,
  profile: UserProfile | null
): { allowed: boolean; maxAllowed: number; reason?: string } {
  const tier = getUserSubscriptionTier(profile);
  const plan = SUBSCRIPTION_PLANS[tier];
  const maxAllowed = plan ? plan.limits.maxFarms : 1;

  if (currentFarmCount >= maxAllowed) {
    return {
      allowed: false,
      maxAllowed,
      reason: tier === "FARMER_FREE"
        ? "Farmer Free is limited to 1 registered farm. Upgrade to Farmer Plus to manage up to 20 farms with satellite GPS boundary mapping."
        : `Your current plan limit of ${maxAllowed} farms has been reached. Contact support to expand your cooperative quota.`,
    };
  }

  return { allowed: true, maxAllowed };
}

/**
 * Submits a subscription upgrade request to Firestore.
 */
export async function submitSubscriptionUpgradeRequest(
  profile: UserProfile,
  requestedTier: SubscriptionTier,
  notes?: string,
  organizationName?: string,
): Promise<string> {
  const requestId = `${profile.uid}_${Date.now()}`;
  const cleanOrganizationName = organizationName?.trim() || profile.organizationName?.trim();
  const requestDoc: SubscriptionRequest = {
    id: requestId,
    userId: profile.uid,
    userEmail: profile.email,
    userName: profile.fullName,
    planId: requestedTier,
    requestedAt: new Date().toISOString(),
    status: "PENDING",
    notes: notes?.trim() || "",
    ...(cleanOrganizationName ? { organizationName: cleanOrganizationName } : {}),
  };

  await setDoc(doc(db, "subscriptionRequests", requestId), {
    ...requestDoc,
    createdAt: serverTimestamp(),
  });

  return requestId;
}
