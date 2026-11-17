import { describe, expect, it } from "vitest";
import {
  evaluateRateLimit,
  generateSalt,
  generateSixDigitOtp,
  hashOtpCode,
  verifyOtpCode,
} from "./otpManager";

describe("email OTP primitives", () => {
  it("generates six numeric digits and validates only with the matching secret", () => {
    const code = generateSixDigitOtp();
    const salt = generateSalt();
    const secret = "test-only-hmac-key";
    const hash = hashOtpCode(code, salt, secret);

    expect(code).toMatch(/^\d{6}$/);
    expect(hash).toMatch(/^[a-f\d]{64}$/);
    expect(verifyOtpCode(code, salt, hash, secret)).toBe(true);
    expect(verifyOtpCode(`${code}1`, salt, hash, secret)).toBe(false);
    expect(verifyOtpCode(code, salt, hash, "different-key")).toBe(false);
  });

  it("rejects malformed or tampered OTP records", () => {
    expect(verifyOtpCode("12x456", "ab".repeat(16), "f".repeat(64), "test-key")).toBe(false);
    expect(verifyOtpCode("123456", "not-hex", "not-a-hash", "test-key")).toBe(false);
  });
});

describe("email OTP rate limits", () => {
  it("enforces resend cooldown and the hourly request cap", () => {
    const now = 1_000_000;
    const first = evaluateRateLimit(undefined, now);
    expect(first.allowed).toBe(true);
    expect(first.newHourlyCount).toBe(1);

    const cooldown = evaluateRateLimit({
      lastSentAt: now,
      hourlyCount: 1,
      windowStart: now,
    }, now + 30_000);
    expect(cooldown.allowed).toBe(false);
    expect(cooldown.cooldownRemainingSeconds).toBe(30);

    const hourlyLimit = evaluateRateLimit({
      lastSentAt: now - 60_000,
      hourlyCount: 5,
      windowStart: now - 60_000,
    }, now);
    expect(hourlyLimit.allowed).toBe(false);

    const nextWindow = evaluateRateLimit({
      lastSentAt: now - 3_600_001,
      hourlyCount: 5,
      windowStart: now - 3_600_001,
    }, now);
    expect(nextWindow.allowed).toBe(true);
    expect(nextWindow.newHourlyCount).toBe(1);
  });
});
