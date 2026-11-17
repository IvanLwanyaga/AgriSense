import { useState, useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { useAuth } from "../context/useAuth";
import {
  getEmailOtpStatus,
  requestEmailOtp,
  submitEmailOtp,
  changeRegistrationEmailAddress,
  logoutUser,
} from "../services/authservice";

interface OtpVerificationPageProps {
  onVerified?: () => void;
}

export default function OtpVerificationPage({ onVerified }: OtpVerificationPageProps) {
  const { user, refreshAuth } = useAuth();

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [destinationEmail, setDestinationEmail] = useState(user?.email || "");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Resend cooldown timer (60 seconds)
  const [cooldown, setCooldown] = useState(0);

  // Change Email Modal state
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState("");

  // Keep destination email in sync with user
  useEffect(() => {
    let active = true;
    void getEmailOtpStatus()
      .then(async (status) => {
        if (!active) return;
        setDestinationEmail(status.destinationEmail || user?.email || "");
        setCooldown(status.cooldownRemainingSeconds);
        if (status.codeSent) {
          setSuccess(`A verification code has been sent to ${status.destinationEmail}.`);
        } else if (status.cooldownRemainingSeconds === 0) {
          const result = await requestEmailOtp();
          if (!active) return;
          setSuccess(result.message || `A verification code has been sent to ${status.destinationEmail}.`);
          setCooldown(result.cooldownSeconds || 60);
        } else {
          setSuccess(`A code was requested recently. You can request another in ${status.cooldownRemainingSeconds}s.`);
        }
      })
      .catch((statusError: unknown) => {
        if (!active) return;
        console.error("Could not load email verification status.", statusError);
        setError(statusError instanceof Error ? statusError.message : "Could not load verification status.");
      })
      .finally(() => {
        if (active) setLoadingStatus(false);
      });
    return () => {
      active = false;
    };
  }, [user?.email]);

  // Cooldown timer interval
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleDigitChange(index: number, value: string) {
    setError("");
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const char = cleaned.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setDigits(next);

    const targetIndex = Math.min(pasted.length, 5);
    inputRefs.current[targetIndex]?.focus();

    // If a full 6-digit code was pasted, trigger verification automatically
    if (pasted.length === 6) {
      void verifyCode(pasted);
    }
  }

  async function verifyCode(codeToVerify?: string) {
    const fullCode = codeToVerify || digits.join("");
    if (fullCode.length !== 6 || !/^\d{6}$/.test(fullCode)) {
      setError("Please enter all six digits of your verification code.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await submitEmailOtp(fullCode);
      setSuccess(result.message || "Email verified successfully! Opening your workspace...");
      await refreshAuth();
      if (onVerified) {
        setTimeout(onVerified, 900);
      }
    } catch (err: unknown) {
      console.error("OTP Verification Error:", err);
      const msg = err instanceof Error ? err.message : "Verification failed. Please try again.";
      setError(msg);
      // Extract remaining attempts if present
      const match = msg.match(/(\d+)\s+attempt/i);
      if (match) {
        setAttemptsRemaining(parseInt(match[1], 10));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (loadingStatus || cooldown > 0 || resending) return;

    setResending(true);
    setError("");
    setSuccess("");

    try {
      const result = await requestEmailOtp();
      setSuccess(result.message || "A fresh verification code has been dispatched to your email.");
      setCooldown(result.cooldownSeconds || 60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      console.error("Resend OTP Error:", err);
      setError(err instanceof Error ? err.message : "Unable to resend verification code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleChangeEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setChangeEmailError("Please enter a valid email address.");
      return;
    }

    setUpdatingEmail(true);
    setChangeEmailError("");

    try {
      const result = await changeRegistrationEmailAddress(clean);
      setDestinationEmail(clean);
      setShowChangeEmail(false);
      setNewEmail("");
      setSuccess(result.message || `Email updated to ${clean}. Check your inbox for the new code.`);
      setCooldown(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      console.error("Email update error:", err);
      setChangeEmailError(err instanceof Error ? err.message : "Failed to update email address.");
    } finally {
      setUpdatingEmail(false);
    }
  }

  const isComplete = digits.every((d) => d.length === 1);

  return (
    <div className="otp-verification-wrapper" style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      background: "linear-gradient(145deg, #0e291c 0%, #1b4332 50%, #2d6a4f 100%)",
    }}>
      <div className="otp-card" style={{
        maxWidth: "480px",
        width: "100%",
        background: "#ffffff",
        borderRadius: "16px",
        padding: "36px 28px",
        boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.2)",
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "#d8f3dc",
            color: "#1b4332",
            fontSize: "26px",
            fontWeight: "bold",
            marginBottom: "12px",
          }}>
            ✉️
          </div>
          <span style={{
            display: "block",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            color: "#2d6a4f",
            marginBottom: "4px",
          }}>
            AgriSense-BCTB · Uganda
          </span>
          <h2 style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: "800",
            color: "#111827",
            letterSpacing: "-0.5px",
          }}>
            Verify Your Email
          </h2>
          <p style={{
            margin: 0,
            fontSize: "14px",
            color: "#4b5563",
            lineHeight: 1.5,
          }}>
            We sent a six-digit verification code to:
          </p>
          <div style={{
            marginTop: "6px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#f3f4f6",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#1b4332",
          }}>
            <span>{destinationEmail}</span>
            <button
              type="button"
              onClick={() => {
                setNewEmail(destinationEmail);
                setChangeEmailError("");
                setShowChangeEmail(true);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#2d6a4f",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "12px",
                padding: 0,
                fontWeight: 600,
              }}
            >
              Change
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #f87171",
            borderRadius: "8px",
            padding: "12px 14px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#991b1b",
            lineHeight: 1.4,
          }} role="alert">
            <div>⚠️ {error}</div>
            {attemptsRemaining !== null && (
              <div style={{ marginTop: "4px", fontSize: "12px", fontWeight: 600, color: "#b91c1c" }}>
                Attempts remaining before code lock: {attemptsRemaining}
              </div>
            )}
          </div>
        )}

        {success && (
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "8px",
            padding: "12px 14px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#166534",
            lineHeight: 1.4,
          }} role="status">
            ✓ {success}
          </div>
        )}

        {/* 6-Digit Code Input Boxes */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            display: "block",
            fontSize: "12px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            color: "#374151",
            marginBottom: "10px",
            textAlign: "center",
          }}>
            Enter 6-Digit Code
          </label>
          <div
            onPaste={handlePaste}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`Verification code digit ${index + 1}`}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={{
                  width: "100%",
                  maxWidth: "54px",
                  height: "56px",
                  textAlign: "center",
                  fontSize: "24px",
                  fontWeight: "700",
                  fontFamily: "monospace",
                  color: "#1b4332",
                  background: digit ? "#f0fdf4" : "#f9fafb",
                  border: digit ? "2px solid #2d6a4f" : "1.5px solid #d1d5db",
                  borderRadius: "10px",
                  outline: "none",
                  transition: "all 0.15s ease",
                  boxShadow: digit ? "0 2px 6px rgba(45, 106, 79, 0.15)" : "none",
                }}
              />
            ))}
          </div>
          <p style={{
            margin: "8px 0 0 0",
            fontSize: "12px",
            color: "#6b7280",
            textAlign: "center",
          }}>
            Code is valid for 5 minutes. You can paste the full code directly.
          </p>
        </div>

        {/* Verify Action Button */}
        <button
          type="button"
          onClick={() => void verifyCode()}
          disabled={!isComplete || loading}
          style={{
            width: "100%",
            height: "48px",
            background: isComplete ? "#2d6a4f" : "#9ca3af",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: "700",
            cursor: isComplete && !loading ? "pointer" : "not-allowed",
            transition: "background 0.2s ease",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loading ? "Verifying Code..." : "Verify Email & Open AgriSense →"}
        </button>

        {/* Resend Code with Countdown */}
        <div style={{
          textAlign: "center",
          fontSize: "13px",
          color: "#4b5563",
          borderTop: "1px solid #f3f4f6",
          paddingTop: "16px",
        }}>
          <span>Didn't receive the email? </span>
          {loadingStatus ? (
            <span role="status">Checking verification status…</span>
          ) : cooldown > 0 ? (
            <span style={{ fontWeight: "600", color: "#6b7280" }}>
              Resend available in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void handleResendCode()}
              disabled={resending || loadingStatus}
              style={{
                background: "transparent",
                border: "none",
                color: "#2d6a4f",
                fontWeight: "700",
                cursor: resending ? "wait" : "pointer",
                textDecoration: "underline",
                padding: "2px 4px",
              }}
            >
              {resending ? "Sending..." : "Resend 6-digit code"}
            </button>
          )}
        </div>

        {/* Tips for Email Delivery */}
        <div style={{
          marginTop: "16px",
          background: "#f8fafc",
          borderRadius: "8px",
          padding: "10px 12px",
          fontSize: "12px",
          color: "#64748b",
          lineHeight: 1.4,
        }}>
          💡 <strong>Tip:</strong> If you do not see the email in a few moments, check your spam or junk folder. Make sure your email address was spelled correctly.
        </div>

        {/* Sign Out / Exit Link */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            type="button"
            onClick={() => void logoutUser()}
            style={{
              background: "transparent",
              border: "none",
              color: "#9ca3af",
              fontSize: "12px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Sign out / Use another account
          </button>
        </div>
      </div>

      {/* Change Registered Email Modal */}
      {showChangeEmail && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          zIndex: 9999,
        }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-registration-email-title"
            style={{
            background: "#ffffff",
            borderRadius: "14px",
            maxWidth: "420px",
            width: "100%",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          }}>
            <h3 id="change-registration-email-title" style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#111827" }}>
              Correct Your Email Address
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#6b7280" }}>
              If you made a typo during registration, enter your correct address below. A new six-digit code will be sent immediately.
            </p>

            {changeEmailError && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #f87171",
                borderRadius: "6px",
                padding: "8px 10px",
                marginBottom: "14px",
                fontSize: "12px",
                color: "#991b1b",
              }}>
                {changeEmailError}
              </div>
            )}

            <form onSubmit={handleChangeEmailSubmit}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                New Email Address
                <input
                  type="email"
                  required
                  placeholder="correct-email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    boxSizing: "border-box",
                    marginTop: "4px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setShowChangeEmail(false)}
                  style={{
                    background: "#f3f4f6",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    fontSize: "13px",
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingEmail}
                  style={{
                    background: "#2d6a4f",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: updatingEmail ? "wait" : "pointer",
                  }}
                >
                  {updatingEmail ? "Updating..." : "Update & Send Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
