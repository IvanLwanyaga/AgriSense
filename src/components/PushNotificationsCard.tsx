import { useState } from "react";
import { disableWebPush, enableWebPush, getPushStatus, sendTestPush, type PushStatus } from "../services/pushService";

export default function PushNotificationsCard() {
  const [status, setStatus] = useState<PushStatus>(() => getPushStatus());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(action: () => Promise<{ ok: boolean; message: string }>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await action();
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setStatus(getPushStatus());
      setBusy(false);
    }
  }

  const isOn = status === "on";
  const isUnavailable = status === "unsupported" || status === "unconfigured";
  const statusLabel = isOn
    ? "Enabled"
    : status === "denied"
      ? "Blocked"
      : status === "unsupported"
        ? "Not supported"
        : status === "unconfigured"
          ? "Not configured"
          : "Off";

  return (
    <div className="push-card">
      <div className="push-card-head">
        <div>
          <strong>Push notifications</strong>
          <small>Get high-risk screening alerts even when AgriSense is closed.</small>
        </div>
        <span className={`push-status ${isOn ? "is-on" : isUnavailable || status === "denied" ? "is-warn" : ""}`}>
          {statusLabel}
        </span>
      </div>

      <p className="push-explainer">
        We only send BCTB risk alerts and important farm updates. You can turn this off at any time.
      </p>

      {status === "unconfigured" && (
        <div className="settings-info-card">
          <strong>Setup required</strong>
          <p>
            Add <code>VITE_FIREBASE_VAPID_KEY</code> to your <code>.env</code> from Firebase Console →
            Cloud Messaging → Web Push certificates, then restart the app.
          </p>
        </div>
      )}

      {status === "unsupported" && (
        <div className="settings-info-card">
          <strong>Browser not supported</strong>
          <p>Use a current version of Chrome, Edge, or Firefox on HTTPS to enable push notifications.</p>
        </div>
      )}

      {status === "denied" && (
        <div className="settings-info-card">
          <strong>Notifications blocked</strong>
          <p>Open your browser's site settings and allow notifications for AgriSense, then try again.</p>
        </div>
      )}

      <div className="push-actions">
        {!isOn ? (
          <button className="primary-button" type="button" disabled={busy || isUnavailable} onClick={() => void run(enableWebPush)}>
            {busy ? "Enabling…" : "Enable push notifications"}
          </button>
        ) : (
          <>
            <button className="outline-button" type="button" disabled={busy} onClick={() => void run(sendTestPush)}>
              {busy ? "Sending…" : "Send test notification"}
            </button>
            <button
              className="outline-button"
              type="button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await disableWebPush();
                  return { ok: true, message: "Push notifications turned off." };
                })
              }
            >
              Turn off
            </button>
          </>
        )}
      </div>

      {message && <p className="push-feedback" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}