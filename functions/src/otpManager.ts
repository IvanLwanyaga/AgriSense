import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_CONFIG = {
  CODE_LENGTH: 6,
  EXPIRATION_MS: 5 * 60 * 1000, // 5 minutes
  EXPIRATION_MINUTES: 5,
  COOLDOWN_MS: 60 * 1000, // 60 seconds
  MAX_HOURLY_REQUESTS: 5,
  MAX_ATTEMPTS: 5,
};

export interface OtpRecord {
  uid: string;
  email: string;
  salt: string;
  otpHash: string;
  expiresAt: number; // Unix timestamp ms
  createdAt: number;
  lastSentAt: number;
  attempts: number;
  used: boolean;
  usedAt?: number;
  deliveryStatus?: "PENDING" | "SENT" | "FAILED" | "USED";
  hourlyCount: number;
  windowStart: number;
  pendingEmailChange?: boolean;
}

/**
 * Generates a cryptographically secure 6-digit numerical OTP.
 */
export function generateSixDigitOtp(): string {
  return randomInt(0, 1000000).toString().padStart(OTP_CONFIG.CODE_LENGTH, "0");
}

/**
 * Generates a cryptographically secure random salt.
 */
export function generateSalt(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Computes a keyed HMAC-SHA256 hash so a leaked OTP record cannot be brute-forced offline.
 */
export function hashOtpCode(code: string, salt: string, secret: string): string {
  if (!secret) throw new Error("An OTP hashing secret is required.");
  return createHmac("sha256", secret).update(`${code.trim()}:${salt}`).digest("hex");
}

/**
 * Timing-safe validation of the submitted OTP code.
 */
export function verifyOtpCode(
  submittedCode: string,
  salt: string,
  storedHash: string,
  secret: string,
): boolean {
  if (
    !secret
    || !/^\d{6}$/.test(submittedCode)
    || !/^[\da-f]{64}$/i.test(storedHash)
    || !/^[\da-f]+$/i.test(salt)
  ) {
    return false;
  }
  const submittedHash = hashOtpCode(submittedCode, salt, secret);
  const a = Buffer.from(submittedHash, "hex");
  const b = Buffer.from(storedHash, "hex");

  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Validates rate limits and cooldowns for sending an OTP.
 */
export function evaluateRateLimit(
  existingRecord?: Partial<Pick<OtpRecord, "lastSentAt" | "hourlyCount" | "windowStart">> | null,
  now = Date.now(),
): {
  allowed: boolean;
  reason?: string;
  cooldownRemainingSeconds?: number;
  newHourlyCount: number;
  newWindowStart: number;
} {
  if (!existingRecord) {
    return {
      allowed: true,
      newHourlyCount: 1,
      newWindowStart: now,
    };
  }

  // 1. Check cooldown (60 seconds between resends)
  if (existingRecord.lastSentAt) {
    const elapsed = now - existingRecord.lastSentAt;
    if (elapsed < OTP_CONFIG.COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((OTP_CONFIG.COOLDOWN_MS - elapsed) / 1000);
      return {
        allowed: false,
        reason: `Please wait ${remainingSeconds} second(s) before requesting another code.`,
        cooldownRemainingSeconds: remainingSeconds,
        newHourlyCount: existingRecord.hourlyCount || 1,
        newWindowStart: existingRecord.windowStart || now,
      };
    }
  }

  // 2. Check rolling 1-hour rate limit
  const windowStart = existingRecord.windowStart || now;
  const isWithinWindow = (now - windowStart) < 60 * 60 * 1000;
  const currentCount = isWithinWindow ? (existingRecord.hourlyCount || 0) : 0;
  const currentWindowStart = isWithinWindow ? windowStart : now;

  if (currentCount >= OTP_CONFIG.MAX_HOURLY_REQUESTS) {
    const minutesLeft = Math.ceil((60 * 60 * 1000 - (now - currentWindowStart)) / 60000);
    return {
      allowed: false,
      reason: `Maximum hourly verification requests reached. Please try again in ${minutesLeft} minute(s).`,
      cooldownRemainingSeconds: 0,
      newHourlyCount: currentCount,
      newWindowStart: currentWindowStart,
    };
  }

  return {
    allowed: true,
    newHourlyCount: currentCount + 1,
    newWindowStart: currentWindowStart,
  };
}
