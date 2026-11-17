import { describe, it, expect } from "vitest";
import {
  getUserSubscriptionTier,
  hasEntitlement,
  canAddFarm,
  getSubscriptionPlans,
} from "./subscriptionService";
import type { UserProfile } from "../types/user";

describe("Subscription & Monetisation Entitlement Service", () => {
  const mockFreeSmallholder: UserProfile = {
    uid: "farmer-free-1",
    fullName: "Nalule Harriet",
    email: "harriet@example.com",
    role: "FARMER",
    status: "ACTIVE",
    organizationId: null,
    subscriptionTier: "FARMER_FREE",
    subscriptionStatus: "FREE",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  const mockPlusGrower: UserProfile = {
    uid: "farmer-plus-1",
    fullName: "Kato Joseph",
    email: "kato@example.com",
    role: "FARMER",
    status: "ACTIVE",
    organizationId: null,
    subscriptionTier: "FARMER_PLUS",
    subscriptionStatus: "ACTIVE",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  const mockCooperativeAdmin: UserProfile = {
    uid: "org-admin-1",
    fullName: "Mukono Union Admin",
    email: "admin@mukonocoop.org",
    role: "ORG_ADMIN",
    status: "ACTIVE",
    organizationId: "mukono-coop-union",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  it("exposes the 3 commercial subscription plans", () => {
    const plans = getSubscriptionPlans();
    expect(plans.length).toBe(3);
    const planIds = plans.map((p) => p.id);
    expect(planIds).toContain("FARMER_FREE");
    expect(planIds).toContain("FARMER_PLUS");
    expect(planIds).toContain("ORGANISATION");
  });

  it("correctly identifies user subscription tiers", () => {
    expect(getUserSubscriptionTier(null)).toBe("FARMER_FREE");
    expect(getUserSubscriptionTier(mockFreeSmallholder)).toBe("FARMER_FREE");
    expect(getUserSubscriptionTier(mockPlusGrower)).toBe("FARMER_PLUS");
    expect(getUserSubscriptionTier(mockCooperativeAdmin)).toBe("ORGANISATION");
  });

  it("enforces basic vs paid entitlements accurately", () => {
    // Free smallholder has basic screening, but no multi-farm or IoT
    expect(hasEntitlement(mockFreeSmallholder, "BASIC_SCREENING")).toBe(true);
    expect(hasEntitlement(mockFreeSmallholder, "MULTI_FARM")).toBe(false);
    expect(hasEntitlement(mockFreeSmallholder, "IOT_SENSORS")).toBe(false);
    expect(hasEntitlement(mockFreeSmallholder, "DOWNLOADABLE_REPORTS")).toBe(false);

    // Farmer Plus has multi-farm, IoT, and downloadable reports
    expect(hasEntitlement(mockPlusGrower, "BASIC_SCREENING")).toBe(true);
    expect(hasEntitlement(mockPlusGrower, "MULTI_FARM")).toBe(true);
    expect(hasEntitlement(mockPlusGrower, "IOT_SENSORS")).toBe(true);
    expect(hasEntitlement(mockPlusGrower, "DOWNLOADABLE_REPORTS")).toBe(true);
    expect(hasEntitlement(mockPlusGrower, "COOPERATIVE_PORTAL")).toBe(false);

    // Organisation has cooperative portal and bulk SMS
    expect(hasEntitlement(mockCooperativeAdmin, "COOPERATIVE_PORTAL")).toBe(true);
    expect(hasEntitlement(mockCooperativeAdmin, "BULK_SMS_DISPATCH")).toBe(true);
  });

  it("enforces farm quota limits per tier", () => {
    // Free smallholder can add 1 farm (currentCount: 0 allowed, currentCount: 1 blocked)
    const check0 = canAddFarm(0, mockFreeSmallholder);
    expect(check0.allowed).toBe(true);
    expect(check0.maxAllowed).toBe(1);

    const check1 = canAddFarm(1, mockFreeSmallholder);
    expect(check1.allowed).toBe(false);
    expect(check1.reason).toContain("Farmer Free is limited to 1 registered farm");

    // Farmer Plus can add up to 20 farms
    const plusCheck5 = canAddFarm(5, mockPlusGrower);
    expect(plusCheck5.allowed).toBe(true);
    expect(plusCheck5.maxAllowed).toBe(20);

    const plusCheck20 = canAddFarm(20, mockPlusGrower);
    expect(plusCheck20.allowed).toBe(false);

    // Organisation can manage up to 500 farms
    const orgCheck150 = canAddFarm(150, mockCooperativeAdmin);
    expect(orgCheck150.allowed).toBe(true);
    expect(orgCheck150.maxAllowed).toBe(500);
  });
});
