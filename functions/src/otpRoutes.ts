
import { createHmac } from "node:crypto";
import { Router, type Request, type Response } from "express";
import type { Auth } from "firebase-admin/auth";
import {
  FieldValue,
  type Firestore,
} from "firebase-admin/firestore";

import {
  generateSixDigitOtp,
  generateSalt,
  hashOtpCode,
  verifyOtpCode,
  evaluateRateLimit,
  OTP_CONFIG,
  type OtpRecord,
} from "./otpManager.js";

import { sendOtpEmail } from "./emailService.js";

function authenticateOtpRequest(
  request: Request,
  response: Response,
  auth: Auth,
  action: string,
): Promise<string | null> {
  return (async () => {
    const match = request.get("authorization")?.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      response.status(401).json({ error: `Sign in to ${action}.` });
      return null;
    }

    try {
      const decodedToken = await auth.verifyIdToken(match[1]);
      return decodedToken.uid;
    } catch {
      response.status(401).json({
        error: "Session expired. Please sign in again.",
      });
      return null;
    }
  })();
}

function respondToOtpIssueError(
  response: Response,
  error: unknown,
): boolean {
  if (error instanceof Error && error.message === "OTP_CONFIGURATION") {
    response.status(503).json({
      error: "Email verification is not configured. Please contact AgriSense support.",
    });
    return true;
  }

  if (error instanceof Error && error.message === "OTP_DELIVERY") {
    response.status(503).json({
      error: "The verification email could not be sent. Please try again later.",
    });
    return true;
  }

  return false;
}

async function issueEmailOtp(
  uid: string,
  email: string,
  recipientName: string | undefined,
  pendingEmailChange: boolean,
  db: Firestore,
): Promise<{
  allowed: boolean;
  reason?: string;
  cooldownRemainingSeconds?: number;
}> {
  const hashSecret = process.env.OTP_HASH_SECRET || "";
  const providerKey = process.env.BREVO_API_KEY || "";
  const fromEmail = process.env.AGRISENSE_FROM_EMAIL || "";

  if (
    Buffer.byteLength(hashSecret, "utf8") < 32 ||
    !providerKey.trim() ||
    !fromEmail.trim()
  ) {
    throw new Error("OTP_CONFIGURATION");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const emailLimitId = createHmac("sha256", hashSecret)
    .update(normalizedEmail)
    .digest("hex");

  const otpDocRef = db.collection("emailOtps").doc(uid);
  const emailLimitRef = db.collection("emailOtpRateLimits").doc(emailLimitId);
  const userDocRef = db.collection("users").doc(uid);

  const now = Date.now();
  const code = generateSixDigitOtp();
  const salt = generateSalt();
  const otpHash = hashOtpCode(code, salt, hashSecret);

  const reservation = await db.runTransaction(async (transaction) => {
    const [otpSnapshot, emailLimitSnapshot, userSnapshot] =
      await Promise.all([
        transaction.get(otpDocRef),
        transaction.get(emailLimitRef),
        transaction.get(userDocRef),
      ]);

    if (!userSnapshot.exists) {
      throw new Error("The authenticated account profile is missing.");
    }

    const uidLimit = evaluateRateLimit(
      otpSnapshot.data() as Partial<OtpRecord> | undefined,
      now,
    );

    const emailLimit = evaluateRateLimit(
      emailLimitSnapshot.data() as Partial<OtpRecord> | undefined,
      now,
    );

    if (!uidLimit.allowed || !emailLimit.allowed) {
      const limitingResult = !uidLimit.allowed ? uidLimit : emailLimit;

      return {
        allowed: false as const,
        reason:
          limitingResult.reason ||
          "Please wait before requesting another verification code.",
        cooldownRemainingSeconds:
          limitingResult.cooldownRemainingSeconds || 60,
      };
    }

    const record: OtpRecord = {
      uid,
      email: normalizedEmail,
      salt,
      otpHash,
      expiresAt: now + OTP_CONFIG.EXPIRATION_MS,
      createdAt: now,
      lastSentAt: now,
      attempts: 0,
      used: false,
      pendingEmailChange,
      deliveryStatus: "PENDING",
      hourlyCount: uidLimit.newHourlyCount,
      windowStart: uidLimit.newWindowStart,
    };

    transaction.set(otpDocRef, record);

    transaction.set(emailLimitRef, {
      lastSentAt: now,
      hourlyCount: emailLimit.newHourlyCount,
      windowStart: emailLimit.newWindowStart,
    });

    if (pendingEmailChange) {
      transaction.set(
        userDocRef,
        {
          pendingEmail: normalizedEmail,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    return { allowed: true as const };
  });

  if (!reservation.allowed) {
    return reservation;
  }

  try {
    await sendOtpEmail(
      {
        to: normalizedEmail,
        recipientName,
        subject: `AgriSense: Your 6-digit verification code is ${code}`,
        otpCode: code,
        expiresInMinutes: OTP_CONFIG.EXPIRATION_MINUTES,
      },
      {
        brevoApiKey: providerKey,
        fromEmail,
      },
    );
  } catch (error) {
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(otpDocRef);

      if (snapshot.data()?.otpHash === otpHash) {
        transaction.update(otpDocRef, {
          otpHash: "",
          salt: "",
          used: true,
          deliveryStatus: "FAILED",
        });
      }
    });

    console.error("OTP email delivery failed:", error);
    throw new Error("OTP_DELIVERY");
  }

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(otpDocRef);

    if (snapshot.data()?.otpHash !== otpHash) {
      throw new Error(
        "The verification code was superseded before delivery completed.",
      );
    }

    transaction.update(otpDocRef, {
      deliveryStatus: "SENT",
      deliveredAt: Date.now(),
    });
  });

  return { allowed: true };
}

export function createOtpRouter(auth: Auth, db: Firestore): Router {
  const router = Router();

  // 1. Send verification code
  router.post("/sendEmailOtp", async (request, response) => {
    try {
      const uid = await authenticateOtpRequest(
        request,
        response,
        auth,
        "request a verification code",
      );

      if (!uid) return;

      const userRecord = await auth.getUser(uid);

      if (!userRecord.email) {
        response.status(400).json({
          error: "No email address found for this user.",
        });
        return;
      }

      if (userRecord.emailVerified) {
        response.json({
          success: true,
          message: "Your email is already verified.",
          alreadyVerified: true,
        });
        return;
      }

      const profileSnapshot = await db.collection("users").doc(uid).get();
      const pendingEmail = profileSnapshot.data()?.pendingEmail;

      const targetEmail =
        typeof pendingEmail === "string" && pendingEmail.trim()
          ? pendingEmail
          : userRecord.email;

      const pendingEmailChange =
        targetEmail.toLowerCase() !== userRecord.email.toLowerCase();

      const result = await issueEmailOtp(
        uid,
        targetEmail,
        userRecord.displayName || undefined,
        pendingEmailChange,
        db,
      );

      if (!result.allowed) {
        response.status(429).json({
          error: result.reason,
          cooldownRemainingSeconds: result.cooldownRemainingSeconds,
        });
        return;
      }

      response.json({
        success: true,
        message: `A six-digit verification code has been sent to ${targetEmail}.`,
        destinationEmail: targetEmail,
        cooldownSeconds: 60,
        expiresInMinutes: OTP_CONFIG.EXPIRATION_MINUTES,
      });
    } catch (error) {
      if (respondToOtpIssueError(response, error)) return;

      console.error("Send OTP error:", error);
      response.status(500).json({
        error: "Unable to send the verification code. Please try again.",
      });
    }
  });

  // 2. Check verification status
  router.get("/getEmailOtpStatus", async (request, response) => {
    try {
      const uid = await authenticateOtpRequest(
        request,
        response,
        auth,
        "check verification status",
      );

      if (!uid) return;

      const [userRecord, otpSnapshot] = await Promise.all([
        auth.getUser(uid),
        db.collection("emailOtps").doc(uid).get(),
      ]);

      const record = otpSnapshot.data() as OtpRecord | undefined;

      const isPendingEmailChange = Boolean(
        record?.pendingEmailChange &&
        !record.used &&
        record.deliveryStatus !== "FAILED",
      );

      const destinationEmail = isPendingEmailChange
        ? record?.email || userRecord.email || ""
        : userRecord.email || "";

      const now = Date.now();

      response.json({
        emailVerified: userRecord.emailVerified,
        destinationEmail,
        codeSent: Boolean(
          record &&
          !record.used &&
          record.deliveryStatus === "SENT" &&
          record.expiresAt > now,
        ),
        expiresInSeconds:
          record && record.deliveryStatus === "SENT"
            ? Math.max(0, Math.ceil((record.expiresAt - now) / 1000))
            : 0,
        cooldownRemainingSeconds: record
          ? Math.max(
              0,
              Math.ceil(
                (record.lastSentAt + OTP_CONFIG.COOLDOWN_MS - now) / 1000,
              ),
            )
          : 0,
      });
    } catch (error) {
      console.error("OTP status error:", error);
      response.status(500).json({
        error: "Unable to check email verification status.",
      });
    }
  });

  // 3. Verify submitted code
  router.post("/verifyEmailOtp", async (request, response) => {
    try {
      const uid = await authenticateOtpRequest(
        request,
        response,
        auth,
        "verify your email",
      );

      if (!uid) return;

      const userRecord = await auth.getUser(uid);

      if (userRecord.emailVerified) {
        response.json({
          success: true,
          alreadyVerified: true,
          message: "Your email is already verified.",
        });
        return;
      }

      const code =
        typeof request.body?.code === "string"
          ? request.body.code.trim()
          : "";

      if (!/^\d{6}$/.test(code)) {
        response.status(400).json({
          error: "Enter a valid 6-digit numeric verification code.",
        });
        return;
      }

      const hashSecret = process.env.OTP_HASH_SECRET || "";

      if (Buffer.byteLength(hashSecret, "utf8") < 32) {
        response.status(503).json({
          error: "Email verification is not configured. Please contact AgriSense support.",
        });
        return;
      }

      const otpDocRef = db.collection("emailOtps").doc(uid);
      const userDocRef = db.collection("users").doc(uid);

      const verification = await db.runTransaction(async (transaction) => {
        const [otpSnapshot, profileSnapshot] = await Promise.all([
          transaction.get(otpDocRef),
          transaction.get(userDocRef),
        ]);

        if (!otpSnapshot.exists) return { status: "missing" as const };

        const data = otpSnapshot.data() as OtpRecord | undefined;

        if (!data || data.uid !== uid) {
          return { status: "missing" as const };
        }

        if (data.used || data.deliveryStatus === "USED") {
          return { status: "used" as const };
        }

        if (data.deliveryStatus !== "SENT") {
          return { status: "not-sent" as const };
        }

        if (
          (!data.pendingEmailChange &&
            data.email !== userRecord.email?.trim().toLowerCase()) ||
          (data.pendingEmailChange && userRecord.emailVerified)
        ) {
          return { status: "email-mismatch" as const };
        }

        const now = Date.now();

        if (now >= data.expiresAt) {
          return { status: "expired" as const };
        }

        if (data.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
          return { status: "locked" as const };
        }

        if (!verifyOtpCode(code, data.salt, data.otpHash, hashSecret)) {
          const attempts = data.attempts + 1;

          transaction.update(otpDocRef, { attempts });

          return {
            status: "incorrect" as const,
            attemptsRemaining: Math.max(
              0,
              OTP_CONFIG.MAX_ATTEMPTS - attempts,
            ),
          };
        }

        if (!profileSnapshot.exists) {
          return { status: "profile-missing" as const };
        }

        const usedAt = Date.now();

        transaction.update(otpDocRef, {
          used: true,
          usedAt,
          deliveryStatus: "USED",
        });

        transaction.update(userDocRef, {
          email: data.email,
          emailVerified: true,
          updatedAt: FieldValue.serverTimestamp(),
          ...(data.pendingEmailChange
            ? { pendingEmail: FieldValue.delete() }
            : {}),
        });

        return {
          status: "verified" as const,
          email: data.email,
          pendingEmailChange: Boolean(data.pendingEmailChange),
          usedAt,
        };
      });

      if (verification.status === "missing" || verification.status === "not-sent") {
        response.status(400).json({
          error: "No active verification code found. Please request a new code.",
        });
        return;
      }

      if (verification.status === "used") {
        response.status(400).json({
          error: "This verification code has already been used. Please request a new code.",
        });
        return;
      }

      if (verification.status === "email-mismatch") {
        response.status(400).json({
          error: "This code was issued for a different email address. Request a new code.",
        });
        return;
      }

      if (verification.status === "expired") {
        response.status(400).json({
          error: "This verification code has expired (valid for 5 minutes). Please request a new code.",
        });
        return;
      }

      if (verification.status === "locked") {
        response.status(429).json({
          error: "Too many incorrect attempts. This code has been locked. Please request a new code.",
        });
        return;
      }

      if (verification.status === "profile-missing") {
        response.status(409).json({
          error: "Your account profile is incomplete. Contact AgriSense support.",
        });
        return;
      }

      if (verification.status === "incorrect") {
        response.status(400).json({
          error:
            verification.attemptsRemaining > 0
              ? `Incorrect verification code. ${verification.attemptsRemaining} attempt(s) remaining.`
              : "Incorrect verification code. Maximum attempts reached. Please request a new code.",
          attemptsRemaining: verification.attemptsRemaining,
        });
        return;
      }

      try {
        await auth.updateUser(uid, {
          ...(verification.pendingEmailChange
            ? { email: verification.email }
            : {}),
          emailVerified: true,
        });
      } catch (error) {
        await db.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(otpDocRef);

          if (snapshot.data()?.usedAt === verification.usedAt) {
            transaction.update(otpDocRef, {
              used: false,
              usedAt: FieldValue.delete(),
              deliveryStatus: "SENT",
            });

            transaction.update(userDocRef, {
              email: userRecord.email || "",
              emailVerified: false,
              ...(verification.pendingEmailChange
                ? { pendingEmail: verification.email }
                : {}),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        });

        throw error;
      }

      response.json({
        success: true,
        message: "Email verified successfully! Welcome to AgriSense.",
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      response.status(500).json({
        error: "Unable to verify your email at this time. Please try again.",
      });
    }
  });

  // 4. Change an unverified registration email
  router.post("/changeRegistrationEmail", async (request, response) => {
    try {
      const uid = await authenticateOtpRequest(
        request,
        response,
        auth,
        "update your email",
      );

      if (!uid) return;

      const newEmail =
        typeof request.body?.newEmail === "string"
          ? request.body.newEmail.trim().toLowerCase()
          : "";

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        response.status(400).json({
          error: "Please provide a valid email address.",
        });
        return;
      }

      const userRecord = await auth.getUser(uid);

      if (userRecord.emailVerified) {
        response.status(400).json({
          error: "Verified accounts must update their email address in AccountSettings.",
        });
        return;
      }

      if (userRecord.email?.toLowerCase() === newEmail) {
        response.status(400).json({
          error: "Enter a different email address.",
        });
        return;
      }

      try {
        const existingUser = await auth.getUserByEmail(newEmail);

        if (existingUser.uid !== uid) {
          response.status(409).json({
            error: "An account already uses that email address.",
          });
          return;
        }
      } catch (error) {
        const errorCode =
          typeof error === "object" && error !== null && "code" in error
            ? error.code
            : undefined;

        if (errorCode !== "auth/user-not-found") {
          throw error;
        }
      }

      const result = await issueEmailOtp(
        uid,
        newEmail,
        userRecord.displayName || undefined,
        true,
        db,
      );

      if (!result.allowed) {
        response.status(429).json({
          error: result.reason,
          cooldownRemainingSeconds: result.cooldownRemainingSeconds,
        });
        return;
      }

      response.json({
        success: true,
        message: `A fresh 6-digit verification code has been sent to ${newEmail}. Your account email changes after verification.`,
        newEmail,
        cooldownSeconds: 60,
      });
    } catch (error) {
      if (respondToOtpIssueError(response, error)) return;

      console.error("Change registration email error:", error);
      response.status(500).json({
        error: "Unable to update your registration email. Please try again.",
      });
    }
  });

  return router;
}
