import { useState } from "react";
import { resetPassword } from "../services/authservice";

export default function ResetPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await resetPassword(email);
      setMessage("Check your inbox for a password reset link.");
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      setError(firebaseError.code === "auth/user-not-found" ? "No account was found for that email." : "Unable to send the reset email. Check the address and try again.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="auth-form"><div className="form-intro"><span className="mobile-mark">A</span><p className="eyebrow">Account recovery</p><h2>Reset your<br /><span>password.</span></h2><p className="form-description">Enter your account email and we will send a secure reset link.</p></div><form onSubmit={handleSubmit}><label>Email address<input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}<button className="auth-submit" type="submit" disabled={loading}>{loading ? "Sending link..." : "Send reset link"}<span>→</span></button></form><button className="back-link" type="button" onClick={onBack}>← Back to sign in</button></div>;
}
