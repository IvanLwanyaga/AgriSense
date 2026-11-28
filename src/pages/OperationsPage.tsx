import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { setCurrentUserSmsConsent } from "../services/firestoreService";
import PushNotificationsCard from "../components/PushNotificationsCard";

type SettingsSection = "account" | "notifications" | "offline" | "privacy";

const settingTabs: Array<{ id: SettingsSection; icon: string; label: string }> = [
  { id: "account", icon: "◉", label: "Account Profile" },
  { id: "notifications", icon: "♢", label: "Notification Rules" },
  { id: "offline", icon: "▣", label: "Data & Offline Cache" },
  { id: "privacy", icon: "▤", label: "Security & Privacy" },
];

function loadPreferences(userId?: string) {
  const defaults = { criticalAlerts: true, weatherAlerts: true, extensionFollowUp: true, timezone: "Africa/Kampala" };
  if (!userId) return defaults;
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(`agrisense_preferences_${userId}`) || "{}") };
  } catch {
    return defaults;
  }
}

export function SettingsPage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [initialPreferences] = useState(() => loadPreferences(user?.uid));
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [criticalAlerts, setCriticalAlerts] = useState(initialPreferences.criticalAlerts);
  const [weatherAlerts, setWeatherAlerts] = useState(initialPreferences.weatherAlerts);
  const [extensionFollowUp, setExtensionFollowUp] = useState(initialPreferences.extensionFollowUp);
  const [saved, setSaved] = useState(false);
  const [timezone, setTimezone] = useState(initialPreferences.timezone);
  const [smsConsent, setSmsConsent] = useState(Boolean(profile?.smsConsent));
  const [smsConsentError, setSmsConsentError] = useState("");

  function handleSave() {
    const key = `agrisense_preferences_${user?.uid ?? "guest"}`;
    localStorage.setItem(key, JSON.stringify({ criticalAlerts, weatherAlerts, extensionFollowUp, timezone }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <section className="workspace-page settings-page">
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">{t.workspacePreferencesSecurity}</p>
          <h2>{t.settingsTitle}</h2>
          <p>{t.settingsDescription}</p>
        </div>
        {activeSection !== "privacy" && <button className="primary-button" onClick={handleSave}>{saved ? t.saved : t.saveChanges}</button>}
      </div>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label={t.settingsSections} role="tablist" aria-orientation="vertical">
          {settingTabs.map((tab) => (
            <button
              key={tab.id}
              id={`settings-tab-${tab.id}`}
              className={`settings-nav-item ${activeSection === tab.id ? "active" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeSection === tab.id}
              aria-controls={`settings-panel-${tab.id}`}
              onClick={() => { setActiveSection(tab.id); setSaved(false); }}
            >
              {tab.icon} <span>{{ account: t.accountProfile, notifications: t.notificationRules, offline: t.dataOfflineCache, privacy: t.securityPrivacy }[tab.id]}</span>
            </button>
          ))}
        </nav>

        <div
          className="settings-content"
          id={`settings-panel-${activeSection}`}
          role="tabpanel"
          aria-labelledby={`settings-tab-${activeSection}`}
          key={activeSection}
        >
          {activeSection === "account" && (
            <div className="settings-section">
              <div><h3>{t.profileInformation}</h3><p>{t.signedInRegionalPreferences}</p></div>
              <div className="settings-form-grid">
                <label>{t.fullName}<input value={profile?.fullName || user?.displayName || ""} readOnly /></label>
                <label>{t.emailAddress}<input value={profile?.email || user?.email || ""} readOnly /></label>
                <label>{t.workspaceRole}<input value={profile?.role?.replace(/_/g, " ") || "FARMER"} readOnly /></label>
                <label>{t.timezone}<select value={timezone} onChange={(event) => setTimezone(event.target.value)}><option value="Africa/Kampala">Africa/Kampala (EAT, UTC+3)</option><option value="UTC">UTC</option></select></label>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="settings-section">
              <div><h3>{t.advisoryNotifications}</h3><p>{t.farmUpdatesPreference}</p></div>
              <PreferenceToggle title={t.criticalBctbAlerts} description={t.criticalBctbDescription} checked={criticalAlerts} onChange={setCriticalAlerts} />
              <PreferenceToggle title={t.weatherAdvisories} description={t.weatherAdvisoriesDescription} checked={weatherAlerts} onChange={setWeatherAlerts} />
              <PreferenceToggle title={t.extensionFollowUp} description={t.extensionFollowUpDescription} checked={extensionFollowUp} onChange={setExtensionFollowUp} />
              <PushNotificationsCard />
            </div>
          )}

          {activeSection === "offline" && (
            <div className="settings-section">
              <div><h3>Data & Offline Cache</h3><p>Recent records and unsent field work stay on this device until they can sync.</p></div>
              <div className="settings-info-card"><strong>Offline-ready storage is active</strong><p>After the app has loaded online, cached farm records, assessment drafts and queued screenings can be opened or completed offline. Changes sync when the connection returns.</p></div>
              <div className="settings-info-card"><strong>Use a trusted device</strong><p>Offline records are stored in this browser. Avoid shared phones, and do not clear browser data while work is waiting to sync.</p></div>
              <div className="settings-info-card"><strong>Install for field use</strong><p>While online, use your browser menu to add AgriSense to your home screen. Open it once online before travelling to an area without coverage.</p></div>
            </div>
          )}

          {activeSection === "privacy" && (
            <div className="settings-section">
              <div><h3>Security & Privacy</h3><p>Review how your account and farm information are used.</p></div>
              <div className="settings-info-card"><strong>Signed in as</strong><p>{profile?.email || user?.email || "Account email unavailable"}</p></div>
              <div className="settings-info-card"><strong>Farm location sharing</strong><p>Farm coordinates are used to center the map and retrieve location-specific weather. Extension referral details are shared only when you enable referral consent in an assessment.</p></div>
              <label className="toggle-row">
                <span><strong>Allow cooperative SMS advisories</strong><small>Cooperative managers may send you opted-in agronomic advisory SMS messages. You can turn this off at any time.</small></span>
                <input type="checkbox" checked={smsConsent} onChange={(event) => {
                  const nextConsent = event.target.checked;
                  setSmsConsentError("");
                  setCurrentUserSmsConsent(nextConsent).then(() => setSmsConsent(nextConsent)).catch((error: unknown) => {
                    setSmsConsentError(error instanceof Error ? error.message : "SMS consent could not be saved.");
                  });
                }} />
              </label>
              {smsConsentError && <p className="form-error" role="alert">{smsConsentError}</p>}
              <div className="settings-info-card"><strong>Account security</strong><p>Sign-in is managed by Firebase Authentication. Never share your password or verification codes.</p></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PreferenceToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="toggle-row">
      <span><strong>{title}</strong><small>{description}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export default SettingsPage;
