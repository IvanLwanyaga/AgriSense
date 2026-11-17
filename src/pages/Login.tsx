import { useState, useEffect } from "react";
import { FirebaseError } from "firebase/app";
import { loginUser } from "../services/authservice";

interface LoginProps {
  onForgotPassword: () => void;
  onLoginSuccess: () => void;
  initialEmail?: string;
  registrationSuccessMessage?: string;
}

export default function Login({
  onForgotPassword,
  onLoginSuccess,
  initialEmail = "",
  registrationSuccessMessage = "",
}: LoginProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginUser(email, password, rememberMe);
      onLoginSuccess();
    } catch (err) {
      console.error(err);
      if (!(err instanceof FirebaseError)) {
        setError("Sign-in failed unexpectedly. Please try again.");
      } else {
        switch (err.code) {
          case "auth/network-request-failed":
          case "auth/too-many-requests":
            setError(
              err.code === "auth/network-request-failed"
                ? "Unable to reach Firebase Authentication. Check your connection and, for local development, make sure npm run dev is running."
                : "Too many sign-in attempts. Wait a little while, then try again."
            );
            break;
          case "auth/invalid-credential":
            setError(
              "Firebase Authentication rejected this email/password pair in the local Auth emulator. Check the exact email and password in Emulator UI → Authentication. Firestore profile details cannot be used as a password."
            );
            break;
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-email":
            setError(
              `Firebase Authentication rejected this sign-in (${err.code}). Check the email/password in the local Auth emulator.`
            );
            break;
          default:
            setError(`Sign-in failed (${err.code}). Please check the account setup and try again.`);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form">
      <div className="form-intro">
        <span className="mobile-mark">A</span>
        <p className="eyebrow">AgriSense-BCTB · Uganda Early-Warning Decision Support</p>
        <h2>Sign in to your<br /><span>coffee decision office.</span></h2>
        <p className="form-description">
          Explainable AI risk screening and cultural management for Black Coffee Twig Borer (<em>Xylosandrus compactus</em>) in Robusta coffee.
        </p>
      </div>

      {registrationSuccessMessage && (
        <div className="form-success" role="status" style={{ marginBottom: 16 }}>
          {registrationSuccessMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>
          Email address
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <div className="form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            /> Remember me
          </label>
          <button type="button" className="forgot-button" onClick={onForgotPassword}>
            Forgot password?
          </button>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in to Workspace"}
          <span>→</span>
        </button>
      </form>

      <div className="secure-note">
        <span>◈</span> Secure access powered by Firebase Authentication
      </div>
    </div>
  );
}
