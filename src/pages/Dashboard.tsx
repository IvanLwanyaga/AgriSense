import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { useLanguage, type SupportedLanguage } from "../context/LanguageContext";
import { logoutUser } from "../services/authservice";
import type { AppPage } from "../types/navigation";
import "./Dashboard.css";      // keep: the inner pages still use these styles
import "./DashboardPro.css";   // new: shell + overview

// Pages
import Farms from "./Farms";
import BctbAssessmentPage from "./BctbAssessmentPage";
import WeatherPage from "./WeatherPage";
import RecommendationsPage from "./RecommendationsPage";
import ActivitiesPage from "./ActivitiesPage";
import AlertsPage from "./AlertsPage";
import MapPage from "./MapPage";
import ExtensionPage from "./ExtensionPage";
import GovernancePage from "./GovernancePage";
import { SettingsPage } from "./OperationsPage";

// Services & Components
import { getFarms, getFields } from "../services/firestoreService";
import { fetchFarmWeather } from "../services/weatherService";
import { getLatestTelemetry, getTelemetryHistory } from "../services/iotService";
import { generateRecommendations } from "../services/recommendationEngine";
import { getAlerts } from "../services/alertService";
import { getActivities } from "../services/activityService";
import { speakText, stopSpeaking } from "../services/voiceService";
import type { Farm, Field } from "../types/farm";
import type { FarmWeatherSummary } from "../types/weather";
import type { TelemetryReading } from "../types/iot";
import type { AgriculturalRecommendation } from "../types/recommendation";
import type { FarmAlert } from "../types/alert";
import type { FarmActivity } from "../types/activity";
import type { ResearchBctbPrediction } from "../types/bctb";

import DataQualityBadge from "../components/DataQualityBadge";
import ExplainabilityModal from "../components/ExplainabilityModal";
import FarmerVoiceAssistant from "../components/FarmerVoiceAssistant";
import SmsBroadcastModal from "../components/SmsBroadcastModal";

/* ------------------------------------------------------------------ */
/* Icons (inline SVG, no extra dependency)                             */
/* ------------------------------------------------------------------ */

const ICONS = {
  overview: "M4 4h7v7H4z M14 4h6v4h-6z M14 11h6v9h-6z M4 14h7v6H4z M6.5 7.5h2 M16 6h2 M16 15h2 M6.5 17h2",
  farms: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  check: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M21 21l-4.6-4.6 M8.5 11h5 M11 8.5v5",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z M9 4v14 M15 6v14",
  weather: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4",
  advice: "M5 19c0-9 5-14 15-14 0 10-5 15-14 15 M5 19c3-4 6-7 10-9",
  journal: "M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z M5 18a2 2 0 0 1 2-2h12 M9 8h6",
  alerts: "M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7 M10 20a2 2 0 0 0 4 0",
  extension: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2 20c0-3.5 3-6 7-6s7 2.5 7 6 M17 5a3 3 0 0 1 0 6 M19 14c2 .7 3 2.5 3 5",
  governance: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
  settings: "M4 7h10 M18 7h2 M4 17h2 M10 17h10 M16 5v4 M8 15v4",
  speaker: "M4 9v6h4l5 4V5L8 9z M16 9a4 4 0 0 1 0 6 M18.5 6.5a8 8 0 0 1 0 11",
  stop: "M7 7h10v10H7z",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  thermo: "M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0z",
  waves: "M3 9c3-3 6 3 9 0s6 3 9 0 M3 15c3-3 6 3 9 0s6 3 9 0",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  sms: "M4 5h16v11H11l-5 4v-4H4z",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18",
  logout: "M9 4H5v16h4 M16 8l4 4-4 4 M20 12H9",
  plus: "M12 5v14 M5 12h14",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  bulb: "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
  flask: "M9 3h6 M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3",
  check2: "M5 12.5l4.5 4.5L19 7.5",
} as const;

type IconName = keyof typeof ICONS;

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name].split(" M").map((d, i) => (
        <path key={i} d={i === 0 ? d : `M${d}`} />
      ))}
    </svg>
  );
}

/** A Robusta twig with ripe cherries and one pin-sized borer hole under a lens. */
function TwigArt() {
  return (
    <svg className="ds-twig" viewBox="0 0 380 280" role="img" aria-label="Coffee twig with a borer entry hole">
      <path d="M8 262 C96 232 160 176 238 128 S346 56 372 18" fill="none" stroke="#8A6240" strokeWidth="9" strokeLinecap="round" />
      <path d="M326 52 C340 40 356 30 372 18" fill="none" stroke="#3B2A1E" strokeWidth="9" strokeLinecap="round" />
      {[
        { x: 70, y: 214, r: -28 }, { x: 128, y: 178, r: 24 }, { x: 170, y: 150, r: -34 },
        { x: 252, y: 108, r: 26 }, { x: 292, y: 84, r: -30 },
      ].map((l, i) => (
        <ellipse key={i} cx={l.x} cy={l.y} rx="46" ry="17" transform={`rotate(${l.r} ${l.x} ${l.y})`} fill={i % 2 ? "#4C9A67" : "#3C8556"} />
      ))}
      {[{ x: 108, y: 206 }, { x: 118, y: 218 }, { x: 214, y: 150 }, { x: 226, y: 160 }].map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="11" fill="#C23B3B" />
          <circle cx={c.x - 3} cy={c.y - 3} r="3" fill="#E58A8A" />
        </g>
      ))}
      <circle cx="268" cy="104" r="26" fill="none" stroke="#E0A526" strokeWidth="3" />
      <circle cx="268" cy="104" r="3.2" fill="#1B120C" />
      <path d="M287 123 L304 140" stroke="#E0A526" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation model                                                    */
/* ------------------------------------------------------------------ */

type NavItem = { page: AppPage; icon: IconName; label: string; roles?: string[] };

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const RISK_COPY = {
  LOW: { label: "Low risk", tone: "good" },
  MODERATE: { label: "Moderate risk", tone: "watch" },
  HIGH: { label: "High risk", tone: "bad" },
} as const;

export default function Dashboard({
  page,
  onNavigate,
}: {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
}) {
  const { user, profile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const role = profile?.role ?? "FARMER";

  // Data states
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);
  const [activeField, setActiveField] = useState<Field | null>(null);
  const [weather, setWeather] = useState<FarmWeatherSummary | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryReading | null>(null);
  const [history, setHistory] = useState<Array<{ time: string; moisture: number; temp: number }>>([]);
  const [recommendations, setRecommendations] = useState<AgriculturalRecommendation[]>([]);
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Session-only result of the latest BCTB check (predictions are not stored)
  const [lastBctb, setLastBctb] = useState<ResearchBctbPrediction | null>(null);

  // Modals & voice
  const [selectedRecForXai, setSelectedRecForXai] = useState<AgriculturalRecommendation | null>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    let active = true;

    async function initializeDashboard() {
      try {
        const userFarms = await getFarms(user?.uid, profile?.organizationId);
        if (!active) return;
        const currentFarm = userFarms[0] || null;
        setActiveFarm(currentFarm);

        if (currentFarm) {
          const fields = await getFields(currentFarm.id);
          if (!active) return;
          const currentField = fields[0] || null;
          setActiveField(currentField);

          const w = await fetchFarmWeather(
            currentFarm.location.latitude,
            currentFarm.location.longitude,
            currentFarm.district
          );
          if (!active) return;
          setWeather(w);

          const latest = getLatestTelemetry(currentFarm.id, currentField?.id);
          setTelemetry(latest);
          setHistory(getTelemetryHistory("NODE-UG-01", 12));

          setRecommendations(generateRecommendations(currentFarm.id, currentField || undefined, latest, w));
          setAlerts(getAlerts(currentFarm.id));
          setActivities(getActivities(currentFarm.id));
        }
      } catch (err) {
        console.error("Dashboard initialization error:", err);
      } finally {
        if (active) setLoaded(true);
      }
    }

    initializeDashboard();

    return () => {
      active = false;
      stopSpeaking();
    };
  }, [user?.uid, profile?.organizationId]);

  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE");
  const activeAlertCount = activeAlerts.length;
  const primaryRecommendation = recommendations[0];

  const roleLabels = {
    PLATFORM_ADMIN: "Platform administrator",
    ORG_ADMIN: "Cooperative administrator",
    FARM_MANAGER: "Farm manager",
    AGRICULTURAL_OFFICER: "Extension officer",
    FARMER: "Farmer workspace",
    VIEWER: "Researcher view",
  } as const;

  const firstName = (profile?.fullName || user?.displayName || "Farmer").split(" ")[0];
  const fullName = profile?.fullName || user?.displayName || "Farm operator";

  function handlePlayAdviceAudio(rec: AgriculturalRecommendation) {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }
    const spokenText = `${rec.title}. ${rec.whatIsHappening}. ${rec.suggestedAction}`;
    setIsPlayingAudio(true);
    speakText(
      spokenText,
      language,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  }

  /* ---------- navigation ---------- */
  const mainNav: NavItem[] = [
    { page: "dashboard", icon: "overview", label: t.overview },
    { page: "bctb-assessment", icon: "check", label: "BCTB screening" },
    { page: "farms", icon: "farms", label: t.farmsAndFields },
    { page: "weather", icon: "weather", label: t.weatherIntel },
    { page: "recommendations", icon: "advice", label: t.recommendations },
    { page: "activities", icon: "journal", label: t.farmJournal },
    { page: "alerts", icon: "alerts", label: t.alerts },
    { page: "map", icon: "map", label: t.liveMap },
  ];
  const teamNavItems: NavItem[] = [
    { page: "extension", icon: "extension", label: t.extensionPortal, roles: ["AGRICULTURAL_OFFICER", "ORG_ADMIN", "PLATFORM_ADMIN"] },
    { page: "governance", icon: "governance", label: t.modelGovernance, roles: ["PLATFORM_ADMIN", "VIEWER"] },
  ];
  const teamNav = teamNavItems.filter((item) => item.roles?.includes(role));

  const pageTitles: Partial<Record<AppPage, string>> = {
    dashboard: t.overview,
    farms: t.farmsAndFields,
    "bctb-assessment": "BCTB screening",
    map: t.liveMap,
    weather: t.weatherIntel,
    recommendations: t.recommendations,
    activities: t.farmJournal,
    alerts: t.alerts,
    extension: t.extensionPortal,
    governance: t.modelGovernance,
    settings: t.settings,
  };

  function NavButton({ item }: { item: NavItem }) {
    const isActive = page === item.page;
    return (
      <button
        className={`ds-nav-item${isActive ? " is-active" : ""}`}
        onClick={() => onNavigate(item.page)}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon name={item.icon} />
        <span>{item.label}</span>
        {item.page === "alerts" && activeAlertCount > 0 && <b className="ds-count">{activeAlertCount}</b>}
      </button>
    );
  }

  /* ---------- soil moisture chart ---------- */
  const values = history.map((h) => h.moisture);
  const hasTrend = values.length > 1;
  const lo = Math.floor(Math.min(...(values.length ? values : [25]), 25)) - 3;
  const hi = Math.ceil(Math.max(...(values.length ? values : [55]), 55)) + 3;
  const yOf = (v: number) => 150 - ((v - lo) / (hi - lo)) * 140;
  const linePath = hasTrend
    ? values.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (values.length - 1)) * 600} ${yOf(v)}`).join(" ")
    : "";
  const areaPath = hasTrend ? `${linePath} L 600 160 L 0 160 Z` : "";
  const lastValue = values.length ? values[values.length - 1] : null;
  const delta = hasTrend && lastValue !== null ? lastValue - values[0] : null;

  /* ---------- metric states (simple agronomic bands) ---------- */
  const moisture = telemetry?.soilMoisture;
  const temp = telemetry?.ambientTemperature;
  const humidity = telemetry?.relativeHumidity;
  const et0 = weather?.indices.referenceEt0;

  const moistureState =
    moisture == null ? null : moisture < 25 ? { t: "Drying", c: "watch" } : moisture > 55 ? { t: "Very wet", c: "info" } : { t: "Adequate", c: "good" };
  const tempState =
    temp == null ? null : temp >= 22 && temp <= 30 ? { t: "Comfortable", c: "good" } : { t: "Outside ideal", c: "watch" };
  const humidityState =
    humidity == null ? null : humidity >= 50 && humidity <= 85 ? { t: "Healthy range", c: "good" } : { t: "Check", c: "watch" };
  const etState =
    et0 == null ? null : et0 < 3 ? { t: "Low", c: "info" } : et0 < 5 ? { t: "Moderate", c: "good" } : { t: "High", c: "watch" };

  const weatherIsLive = Boolean(weather) && !weather?.isFallback;

  return (
    <div className="ds-shell">
      {/* ------------------------------ Sidebar ------------------------------ */}
      <aside className="ds-sidebar">
        <div className="ds-brand">
          <span className="ds-brand-mark" aria-hidden="true">A</span>
          <div>
            <strong>AgriSense</strong>
            <small>Uganda · Robusta coffee</small>
          </div>
        </div>

        <div className="ds-farm" title="Selected farm">
          <span className="ds-farm-label">Your farm</span>
          <strong>{activeFarm?.name || "No farm yet"}</strong>
          <small>{activeFarm ? activeFarm.district : "Register one to begin"}</small>
        </div>

        <nav className="ds-nav" aria-label="Main navigation">
          {mainNav.map((item) => <NavButton key={item.page} item={item} />)}
          {teamNav.length > 0 && <span className="ds-nav-group">Team</span>}
          {teamNav.map((item) => <NavButton key={item.page} item={item} />)}
        </nav>

        <div className="ds-sidebar-foot">
          <NavButton item={{ page: "settings", icon: "settings", label: t.settings }} />
          <button className="ds-profile" onClick={() => logoutUser()} title="Sign out of AgriSense">
            <span className="ds-avatar">{fullName.charAt(0).toUpperCase()}</span>
            <span className="ds-profile-copy">
              <strong>{fullName}</strong>
              <small>{roleLabels[role]}</small>
            </span>
            <Icon name="logout" size={18} />
            <span className="ds-sr">{t.signOut}</span>
          </button>
        </div>
      </aside>

      {/* ------------------------------- Main -------------------------------- */}
      <main className="ds-main" id="overview">
        <header className="ds-topbar">
          <div>
            <p className="ds-crumb">Uganda agricultural decision support</p>
            <h1>{pageTitles[page] ?? "AgriSense"}</h1>
          </div>

          <div className="ds-actions">
            <label className="ds-lang" title="Switch language">
              <Icon name="globe" size={18} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                aria-label="Select language"
              >
                <option value="en">English (UG)</option>
                <option value="lg">Luganda</option>
                <option value="sw">Kiswahili</option>
                <option value="nyn">Runyankole</option>
              </select>
            </label>

            <DataQualityBadge
              source={telemetry?.source}
              quality={telemetry?.quality}
              isFallback={weather?.isFallback}
            />

            <button
              className="ds-icon-btn"
              aria-label="Send SMS alert"
              onClick={() => setShowSmsModal(true)}
              title="Send an SMS alert to a farmer's phone"
            >
              <Icon name="sms" />
            </button>

            <button className="ds-icon-btn" aria-label="Alerts" onClick={() => onNavigate("alerts")}>
              <Icon name="alerts" />
              {activeAlertCount > 0 && <span className="ds-dot" />}
            </button>

            <button className="ds-btn ds-btn-primary" onClick={() => onNavigate("farms")}>
              <Icon name="plus" size={18} /> {t.registerFarm}
            </button>
          </div>
        </header>

        {/* ---------------------------- Page routing ---------------------------- */}
        {page === "bctb-assessment" ? (
          <BctbAssessmentPage onResult={setLastBctb} />
        ) : page === "farms" ? (
          <Farms />
        ) : page === "map" ? (
          <MapPage onNavigate={onNavigate} />
        ) : page === "weather" ? (
          <WeatherPage />
        ) : page === "recommendations" ? (
          <RecommendationsPage />
        ) : page === "activities" ? (
          <ActivitiesPage />
        ) : page === "alerts" ? (
          <AlertsPage />
        ) : page === "extension" ? (
          <ExtensionPage />
        ) : page === "governance" ? (
          <GovernancePage />
        ) : page === "settings" ? (
          <SettingsPage />
        ) : (
          <>
            {/* ------------------------------ Hero ------------------------------ */}
            <section className="ds-hero" aria-labelledby="ds-hero-title">
              <div className="ds-hero-copy">
                <span className={`ds-live ${weatherIsLive ? "is-live" : ""}`}>
                  <i /> {!loaded ? "Loading farm data" : weatherIsLive ? "Live weather" : "Using backup data"}
                </span>
                <h2 id="ds-hero-title">
                  {greeting()}, {firstName}
                </h2>
                <p className="ds-hero-sub">
                  {activeFarm
                    ? `${activeFarm.name} · ${activeFarm.district}${activeField ? ` · ${activeField.name}` : ""}`
                    : "Register your coffee farm to start checking for twig borer."}
                </p>

                <div className="ds-hero-cta">
                  <button className="ds-btn ds-btn-light" onClick={() => onNavigate("bctb-assessment")}>
                    <Icon name="check" size={18} /> Check my coffee twigs
                  </button>
                  <button className="ds-btn ds-btn-ghost" onClick={() => onNavigate("recommendations")}>
                    See today&rsquo;s advice <Icon name="arrow" size={16} />
                  </button>
                </div>

                <dl className="ds-hero-facts">
                  <div>
                    <dt>Weather</dt>
                    <dd>
                      {weather
                        ? `${weather.current.temperatureCelsius}°C · ${weather.current.rainProbabilityPercent}% rain`
                        : "Not loaded yet"}
                    </dd>
                  </div>
                  <div>
                    <dt>Active alerts</dt>
                    <dd>{activeAlertCount === 0 ? "None" : activeAlertCount}</dd>
                  </div>
                  <div>
                    <dt>Last twig check</dt>
                    <dd>
                      {lastBctb ? (
                        <span className={`ds-risk ds-risk-${RISK_COPY[lastBctb.predicted_risk].tone}`}>
                          {RISK_COPY[lastBctb.predicted_risk].label}
                        </span>
                      ) : (
                        "Not done this session"
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <TwigArt />
            </section>

            {/* ------------------------- Quick actions ------------------------- */}
            <nav className="ds-quick" aria-label="Quick actions">
              {(
                [
                  { page: "bctb-assessment", icon: "check", label: "Check twigs", hint: "7 quick questions" },
                  { page: "weather", icon: "weather", label: t.weatherIntel, hint: "Forecast and rain" },
                  { page: "recommendations", icon: "advice", label: t.recommendations, hint: "What to do next" },
                  { page: "activities", icon: "journal", label: t.farmJournal, hint: "Log your work" },
                  { page: "alerts", icon: "alerts", label: t.alerts, hint: activeAlertCount ? `${activeAlertCount} active` : "All clear" },
                  { page: "farms", icon: "farms", label: t.farmsAndFields, hint: "Plots and trees" },
                ] as { page: AppPage; icon: IconName; label: string; hint: string }[]
              ).map((q) => (
                <button key={q.page} className="ds-quick-tile" onClick={() => onNavigate(q.page)}>
                  <span className="ds-quick-icon"><Icon name={q.icon} size={22} /></span>
                  <strong>{q.label}</strong>
                  <small>{q.hint}</small>
                </button>
              ))}
            </nav>

            {/* ---------------------------- Conditions --------------------------- */}
            <section className="ds-conditions" aria-label="Field conditions">
              <h3 className="ds-section-title">Conditions in your field</h3>
              <div className="ds-cond-grid">
                <article>
                  <span className="ds-cond-icon"><Icon name="drop" size={20} /></span>
                  <p>{t.soilMoisture}</p>
                  <strong>{moisture ?? "–"}<small>% VWC</small></strong>
                  {moistureState && <em className={`ds-chip ds-chip-${moistureState.c}`}>{moistureState.t}</em>}
                  <span className="ds-cond-foot">Target 28–55%</span>
                </article>
                <article>
                  <span className="ds-cond-icon"><Icon name="thermo" size={20} /></span>
                  <p>{t.temperature}</p>
                  <strong>{temp ?? "–"}<small>°C</small></strong>
                  {tempState && <em className={`ds-chip ds-chip-${tempState.c}`}>{tempState.t}</em>}
                  <span className="ds-cond-foot">Robusta likes 22–30°C</span>
                </article>
                <article>
                  <span className="ds-cond-icon"><Icon name="waves" size={20} /></span>
                  <p>{t.relativeHumidity}</p>
                  <strong>{humidity ?? "–"}<small>%</small></strong>
                  {humidityState && <em className={`ds-chip ds-chip-${humidityState.c}`}>{humidityState.t}</em>}
                  <span className="ds-cond-foot">Healthy 50–85%</span>
                </article>
                <article>
                  <span className="ds-cond-icon"><Icon name="weather" size={20} /></span>
                  <p>{t.evapotranspiration}</p>
                  <strong>{et0 ?? "–"}<small>mm/day</small></strong>
                  {etState && <em className={`ds-chip ds-chip-${etState.c}`}>{etState.t}</em>}
                  <span className="ds-cond-foot">Regional estimate</span>
                </article>
              </div>
            </section>

            {/* ---------------------- Trend + recommendation --------------------- */}
            <div className="ds-grid-2">
              <section className="ds-panel">
                <div className="ds-panel-head">
                  <div>
                    <h3>Soil moisture, last 24 hours</h3>
                    {delta !== null && (
                      <p className="ds-muted">
                        {delta === 0
                          ? "No change over the period."
                          : `${delta < 0 ? "Down" : "Up"} ${Math.abs(delta).toFixed(1)} points over the period.`}
                      </p>
                    )}
                  </div>
                  <button className="ds-link" onClick={() => onNavigate("weather")}>
                    Device readings <Icon name="arrow" size={14} />
                  </button>
                </div>

                {hasTrend ? (
                  <div className="ds-chart">
                    <div className="ds-chart-plot">
                      <svg viewBox="0 0 600 160" preserveAspectRatio="none" role="img" aria-label="Soil moisture trend">
                        <defs>
                          <linearGradient id="dsFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3C8556" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#3C8556" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <rect x="0" y={yOf(55)} width="600" height={yOf(28) - yOf(55)} fill="#3C8556" opacity="0.09" />
                        <path d={areaPath} fill="url(#dsFill)" />
                        <path d={linePath} fill="none" stroke="#2E7048" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      </svg>
                      {lastValue !== null && (
                        <span className="ds-chart-dot" style={{ top: `${(yOf(lastValue) / 160) * 100}%` }} />
                      )}
                      <span className="ds-chart-band" style={{ top: `${(yOf(55) / 160) * 100}%` }}>55%</span>
                      <span className="ds-chart-band" style={{ top: `${(yOf(28) / 160) * 100}%` }}>28%</span>
                    </div>
                    <div className="ds-chart-x">
                      <span>{history[0]?.time}</span>
                      <span>{history[Math.floor(history.length / 2)]?.time}</span>
                      <span>{history[history.length - 1]?.time}</span>
                    </div>
                    <p className="ds-legend"><i /> Shaded band is the healthy range (28–55%)</p>
                  </div>
                ) : (
                  <p className="ds-empty">Moisture readings will appear here once a device reports.</p>
                )}
              </section>

              {primaryRecommendation ? (
                <section className="ds-panel ds-advice">
                  <div className="ds-panel-head">
                    <div>
                      <h3>{primaryRecommendation.type.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase())}</h3>
                      <p className="ds-muted">Today&rsquo;s top advice for your farm</p>
                    </div>
                    <span className={`ds-priority ds-priority-${primaryRecommendation.priority.toLowerCase()}`}>
                      {primaryRecommendation.priority}
                    </span>
                  </div>

                  <h4>{primaryRecommendation.title}</h4>
                  <p className="ds-advice-action">{primaryRecommendation.suggestedAction}</p>

                  <button
                    className={`ds-btn ds-btn-soft${isPlayingAudio ? " is-playing" : ""}`}
                    onClick={() => handlePlayAdviceAudio(primaryRecommendation)}
                    aria-pressed={isPlayingAudio}
                  >
                    <Icon name={isPlayingAudio ? "stop" : "speaker"} size={18} />
                    {isPlayingAudio ? t.speakingAdvice : t.listenToAdvice}
                  </button>

                  <ul className="ds-reasons">
                    <li>
                      <Icon name="eye" size={18} />
                      <span><b>{t.whatIsHappening}</b>{primaryRecommendation.whatIsHappening}</span>
                    </li>
                    <li>
                      <Icon name="bulb" size={18} />
                      <span><b>{t.whyItIsHappening}</b>{primaryRecommendation.whyItIsHappening}</span>
                    </li>
                  </ul>

                  <button className="ds-btn ds-btn-outline" onClick={() => setSelectedRecForXai(primaryRecommendation)}>
                    <Icon name="flask" size={18} /> Why did AI suggest this?
                  </button>
                </section>
              ) : (
                <section className="ds-panel">
                  <div className="ds-panel-head"><h3>Today&rsquo;s advice</h3></div>
                  <p className="ds-empty">
                    {activeFarm
                      ? "No advice right now. Check back after the next reading."
                      : "Register a farm to get advice for your coffee."}
                  </p>
                </section>
              )}
            </div>

            {/* ----------------------- Alerts + journal ------------------------- */}
            <div className="ds-grid-2">
              <section className="ds-panel">
                <div className="ds-panel-head">
                  <h3>Needs your attention</h3>
                  <button className="ds-link" onClick={() => onNavigate("alerts")}>
                    All alerts ({alerts.length}) <Icon name="arrow" size={14} />
                  </button>
                </div>
                {alerts.length === 0 ? (
                  <p className="ds-empty">No alerts. Your farm looks calm right now.</p>
                ) : (
                  <ul className="ds-list">
                    {alerts.slice(0, 3).map((alt) => (
                      <li key={alt.id}>
                        <span className={`ds-sev ds-sev-${alt.severity.toLowerCase()}`} aria-hidden="true" />
                        <div>
                          <strong>{alt.title}</strong>
                          <small className="ds-clamp">{alt.description}</small>
                        </div>
                        <em className={`ds-tag ds-tag-${alt.severity.toLowerCase()}`}>{alt.severity}</em>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="ds-panel">
                <div className="ds-panel-head">
                  <h3>Recent work on the farm</h3>
                  <button className="ds-link" onClick={() => onNavigate("activities")}>
                    Open journal <Icon name="arrow" size={14} />
                  </button>
                </div>
                {activities.length === 0 ? (
                  <p className="ds-empty">Nothing logged yet. Record pruning, weeding or spraying in your journal.</p>
                ) : (
                  <ul className="ds-list">
                    {activities.slice(0, 3).map((act) => (
                      <li key={act.id}>
                        <span className="ds-tick"><Icon name="check2" size={14} /></span>
                        <div>
                          <strong>{act.title}</strong>
                          <small>
                            {act.date} · {act.activityType.replace(/_/g, " ").toLowerCase()}
                            {act.costUgx ? ` · UGX ${act.costUgx.toLocaleString()}` : ""}
                          </small>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <p className="ds-note">
              Advice is explained with SHAP and LIME so you can see why it was given. {t.advisoryDisclaimer}
            </p>
          </>
        )}

        <ExplainabilityModal recommendation={selectedRecForXai} onClose={() => setSelectedRecForXai(null)} />

        {showSmsModal && (
          <SmsBroadcastModal
            onClose={() => setShowSmsModal(false)}
            defaultFarmName={activeFarm?.name}
            defaultAdvice={primaryRecommendation?.suggestedAction}
          />
        )}

        <FarmerVoiceAssistant
          currentMoisture={telemetry?.soilMoisture ?? 34}
          rainProbability={weather?.current?.rainProbabilityPercent ?? 35}
        />
      </main>
    </div>
  );
}
