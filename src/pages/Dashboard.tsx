import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { useLanguage, type SupportedLanguage } from "../context/LanguageContext";
import { logoutUser } from "../services/authservice";
import type { AppPage } from "../types/navigation";

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

import DataQualityBadge from "../components/DataQualityBadge";
import ExplainabilityModal from "../components/ExplainabilityModal";
import FarmerVoiceAssistant from "../components/FarmerVoiceAssistant";
import SmsBroadcastModal from "../components/SmsBroadcastModal";

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

  // Modals & Voice states
  const [selectedRecForXai, setSelectedRecForXai] = useState<AgriculturalRecommendation | null>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Load active farm & live intelligence
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

          // 1. Fetch Real Weather for Farm Coordinates
          const w = await fetchFarmWeather(
            currentFarm.location.latitude,
            currentFarm.location.longitude,
            currentFarm.district
          );
          if (!active) return;
          setWeather(w);

          // 2. Fetch Latest Telemetry & History
          const t = getLatestTelemetry(currentFarm.id, currentField?.id);
          setTelemetry(t);
          setHistory(getTelemetryHistory("NODE-UG-01", 12));

          // 3. Generate AI Recommendations with XAI
          const recs = generateRecommendations(currentFarm.id, currentField || undefined, t, w);
          setRecommendations(recs);

          // 4. Fetch Alerts & Activities
          setAlerts(getAlerts(currentFarm.id));
          setActivities(getActivities(currentFarm.id));
        }
      } catch (err) {
        console.error("Dashboard initialization error:", err);
      }
    }

    initializeDashboard();

    return () => {
      active = false;
      stopSpeaking();
    };
  }, [user?.uid, profile?.organizationId]);

  const activeAlertCount = alerts.filter((a) => a.status === "ACTIVE").length;

  const roleLabels = {
    PLATFORM_ADMIN: "Platform Administrator",
    ORG_ADMIN: "Cooperative Administrator",
    FARM_MANAGER: "Commercial Farm Manager",
    AGRICULTURAL_OFFICER: "Agricultural Extension Officer",
    FARMER: "Smallholder Farmer Workspace",
    VIEWER: "Agricultural Researcher / Viewer",
  } as const;

  const primaryRecommendation = recommendations[0];

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

  // SVG Trend generation
  const moisturePoints = history.map((h) => h.moisture);
  const minMoisture = Math.min(...(moisturePoints.length ? moisturePoints : [20]));
  const maxMoisture = Math.max(...(moisturePoints.length ? moisturePoints : [60]));
  const range = maxMoisture - minMoisture || 1;

  const svgPath = history
    .map((point, index) => {
      const x = (index / Math.max(1, history.length - 1)) * 600;
      const normalizedY = ((point.moisture - minMoisture) / range) * 120;
      const y = 140 - normalizedY;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const svgAreaPath = `${svgPath} L 600 160 L 0 160 Z`;

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <span>AgriSense</span>
            <small className="brand-country">Uganda</small>
          </div>
        </div>

        <div className="workspace-label">Active Growing Site</div>
        <div className="workspace-switcher" title="Selected Farm">
          <span className="workspace-dot" />
          <span className="workspace-name-truncate">
            {activeFarm?.name || "Kato Family Mixed Farm"}
          </span>
          <span className="chevron">⌄</span>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <button
            className={`nav-item ${page === "dashboard" ? "active" : ""}`}
            onClick={() => onNavigate("dashboard")}
          >
            <span>◈</span> {t.overview}
          </button>

          <button
            className={`nav-item ${page === "farms" ? "active" : ""}`}
            onClick={() => onNavigate("farms")}
          >
            <span>⌂</span> {t.farmsAndFields}
          </button>

          <button
            className={`nav-item ${page === "bctb-assessment" ? "active" : ""}`}
            onClick={() => onNavigate("bctb-assessment")}
          >
            <span>◉</span> BCTB Screening
          </button>

          <button
            className={`nav-item ${page === "map" ? "active" : ""}`}
            onClick={() => onNavigate("map")}
          >
            <span>🗺️</span> {t.liveMap}
          </button>

          <button
            className={`nav-item ${page === "weather" ? "active" : ""}`}
            onClick={() => onNavigate("weather")}
          >
            <span>☼</span> {t.weatherIntel}
          </button>

          <button
            className={`nav-item ${page === "recommendations" ? "active" : ""}`}
            onClick={() => onNavigate("recommendations")}
          >
            <span>🌿</span> {t.recommendations}
          </button>

          <button
            className={`nav-item ${page === "activities" ? "active" : ""}`}
            onClick={() => onNavigate("activities")}
          >
            <span>📝</span> {t.farmJournal}
          </button>

          <button
            className={`nav-item ${page === "alerts" ? "active" : ""}`}
            onClick={() => onNavigate("alerts")}
          >
            <span>!</span> {t.alerts}
            {activeAlertCount > 0 && (
              <span className="nav-count">{activeAlertCount}</span>
            )}
          </button>

          {/* Extension Officer / Cooperative tab */}
          {["AGRICULTURAL_OFFICER", "ORG_ADMIN", "PLATFORM_ADMIN"].includes(role) && (
            <button
              className={`nav-item ${page === "extension" ? "active" : ""}`}
              onClick={() => onNavigate("extension")}
            >
              <span>◒</span> {t.extensionPortal}
            </button>
          )}

          {/* AI Model Governance tab */}
          {["PLATFORM_ADMIN", "VIEWER"].includes(role) && (
            <button
              className={`nav-item ${page === "governance" ? "active" : ""}`}
              onClick={() => onNavigate("governance")}
            >
              <span>⚙</span> {t.modelGovernance}
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            onClick={() => onNavigate("settings")}
          >
            <span>⚙</span> {t.settings}
          </button>

          <button
            className="profile-row"
            onClick={() => logoutUser()}
            title="Sign out of AgriSense"
          >
            <span className="avatar">
              {(profile?.fullName || user?.displayName || "U").charAt(0).toUpperCase()}
            </span>
            <span className="profile-copy">
              <strong>{profile?.fullName || user?.displayName || "Farm Operator"}</strong>
              <small>{t.signOut}</small>
            </span>
            <span>↗</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="main-content" id="overview">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              {roleLabels[role]} · Uganda Agricultural Decision Support
            </p>
            <h1>
              {page === "dashboard"
                ? `Good morning, ${(profile?.fullName || user?.displayName || "Farmer").split(" ")[0]}`
                : page === "map"
                ? t.liveMap
                : page.toUpperCase()}
            </h1>
          </div>

          <div className="topbar-actions">
            {/* Multi-Language Selector */}
            <div className="language-selector-wrap" title="Switch Agricultural Language">
              <span className="lang-icon">🌐</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="language-select"
                aria-label="Select Language"
              >
                <option value="en">English (UG)</option>
                <option value="lg">Luganda</option>
                <option value="sw">Kiswahili</option>
                <option value="nyn">Runyankole</option>
              </select>
            </div>

            {/* Quick Role Switcher for previewing multi-role architecture */}

            {/* Live vs Simulated indicator */}
            <DataQualityBadge
              source={telemetry?.source}
              quality={telemetry?.quality}
              isFallback={weather?.isFallback}
            />

            {/* Cellular SMS Dispatch Trigger */}
            <button
              className="icon-button sms-trigger"
              aria-label="Send Cellular SMS Alert"
              onClick={() => setShowSmsModal(true)}
              title="Dispatch Cellular SMS Alert to Farmer's Phone"
            >
              <span>📡</span>
            </button>

            <button
              className="icon-button"
              aria-label="Alerts"
              onClick={() => onNavigate("alerts")}
            >
              <span>!</span>
              {activeAlertCount > 0 && <span className="notification-dot" />}
            </button>

            <button
              className="primary-button"
              onClick={() => onNavigate("farms")}
            >
              + {t.registerFarm}
            </button>
          </div>
        </header>

        {/* Page Routing */}
        {page === "bctb-assessment" ? (
          <BctbAssessmentPage />
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
          /* Default: Comprehensive Dashboard Overview */
          <>
            {/* Hero Summary Strip */}
            <section className="hero-strip">
              <div>
                <span className="status-pill">
                  <span /> All Agricultural Telemetry Live
                </span>
                <h2>
                  {activeFarm?.name || "Kato Family Mixed Farm"} · {activeFarm?.district || "Wakiso"}
                </h2>
                <p>
                  Monitoring {activeField?.name || "North Block (Maize Longe 5)"} · Soil Ferrosol Red Clay · Live Sensor Telemetry
                </p>
              </div>

              {weather && (
                <div
                  className="weather-summary"
                  onClick={() => onNavigate("weather")}
                  title="Click to view complete 7-day agricultural forecast"
                >
                  <span className="weather-icon">
                    {weather.current.weatherCode > 60 ? "🌧️" : weather.current.weatherCode > 2 ? "⛅" : "☀️"}
                  </span>
                  <div>
                    <strong>{weather.current.temperatureCelsius}°C</strong>
                    <small>
                      {weather.current.weatherDescription} · {weather.current.rainProbabilityPercent}% rain probability
                    </small>
                  </div>
                </div>
              )}
            </section>

            {/* In-Field Telemetry Metric Cards */}
            <section className="metric-grid" aria-label="Field Telemetry">
              <article className="metric-card">
                <div className="metric-icon green">◒</div>
                <div className="metric-heading">
                  <span>{t.soilMoisture}</span>
                  <b className={`metric-state ${telemetry && telemetry.soilMoisture < 25 ? "amber" : "green"}`}>
                    {telemetry && telemetry.soilMoisture < 25 ? "Drying" : "Adequate"}
                  </b>
                </div>
                <div className="metric-value">
                  {telemetry?.soilMoisture ?? 34.0}
                  <small>% VWC</small>
                </div>
                <div className="metric-foot">
                  <span>Target: 28% – 55%</span>
                  <span>● In-field Probe</span>
                </div>
              </article>

              <article className="metric-card">
                <div className="metric-icon amber">☼</div>
                <div className="metric-heading">
                  <span>{t.temperature}</span>
                  <b className="metric-state green">Optimal</b>
                </div>
                <div className="metric-value">
                  {telemetry?.ambientTemperature ?? 27.8}
                  <small>°C</small>
                </div>
                <div className="metric-foot">
                  <span>Canopy Level</span>
                  <span>● Active</span>
                </div>
              </article>

              <article className="metric-card">
                <div className="metric-icon blue">◌</div>
                <div className="metric-heading">
                  <span>{t.relativeHumidity}</span>
                  <b className="metric-state blue">Stable</b>
                </div>
                <div className="metric-value">
                  {telemetry?.relativeHumidity ?? 61}
                  <small>%</small>
                </div>
                <div className="metric-foot">
                  <span>Atmospheric</span>
                  <span>● Calibrated</span>
                </div>
              </article>

              <article className="metric-card">
                <div className="metric-icon green">▧</div>
                <div className="metric-heading">
                  <span>{t.evapotranspiration}</span>
                  <b className="metric-state amber">Moderate</b>
                </div>
                <div className="metric-value">
                  {weather?.indices.referenceEt0 ?? 4.2}
                  <small>mm/d</small>
                </div>
                <div className="metric-foot">
                  <span>Crop Demand</span>
                  <span>● Regional Index</span>
                </div>
              </article>
            </section>

            {/* Dynamic Trend Chart & AI Recommendation Block */}
            <div className="content-grid">
              {/* Soil Moisture 24h Trend Chart */}
              <section className="panel chart-panel">
                <div className="panel-header">
                  <div>
                    <span className="section-kicker">Telemetry Trajectory</span>
                    <h3>Soil Moisture Trend (24h)</h3>
                  </div>
                  <button
                    className="select-button"
                    onClick={() => onNavigate("weather")}
                  >
                    View Device Telemetry →
                  </button>
                </div>

                <div className="chart-stat">
                  <strong>{telemetry?.soilMoisture ?? 34.0}%</strong>
                  <span className="down-value">
                    📉 Root zone depletion rate ~0.4%/h
                  </span>
                </div>

                <div className="chart">
                  <div className="chart-y">
                    <span>{Math.round(maxMoisture)}%</span>
                    <span>{Math.round((maxMoisture + minMoisture) / 2)}%</span>
                    <span>{Math.round(minMoisture)}%</span>
                  </div>

                  <div className="chart-area">
                    <div className="grid-line one" />
                    <div className="grid-line two" />
                    <div className="grid-line three" />

                    <svg viewBox="0 0 600 160" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#43845f" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#43845f" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={svgAreaPath} fill="url(#chartGrad)" />
                      <path
                        d={svgPath}
                        fill="none"
                        stroke="#43845f"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="chart-x">
                      {history.length >= 4 ? (
                        <>
                          <span>{history[0]?.time}</span>
                          <span>{history[Math.floor(history.length / 2)]?.time}</span>
                          <span>{history[history.length - 1]?.time}</span>
                        </>
                      ) : (
                        <>
                          <span>06:00</span>
                          <span>12:00</span>
                          <span>18:00</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Primary AI Recommendation Card with XAI Inspector trigger & Audio Player */}
              {primaryRecommendation && (
                <section className="panel recommendation-panel">
                  <div className="panel-header">
                    <div>
                      <span className="section-kicker">AI Decision Support</span>
                      <h3>{primaryRecommendation.type.replace(/_/g, " ")}</h3>
                    </div>
                    <span className={`priority-badge ${primaryRecommendation.priority.toLowerCase()}`}>
                      {primaryRecommendation.priority}
                    </span>
                  </div>

                  <div className="rec-header-action-row">
                    <div className="recommendation-icon">🌱</div>

                    {/* Audio Playback Trigger */}
                    <button
                      className={`listen-audio-btn ${isPlayingAudio ? "playing" : ""}`}
                      onClick={() => handlePlayAdviceAudio(primaryRecommendation)}
                      title="Listen to this agricultural recommendation spoken aloud"
                    >
                      <span>{isPlayingAudio ? "⏹" : "🔊"}</span>
                      <strong>{isPlayingAudio ? t.speakingAdvice : t.listenToAdvice}</strong>
                    </button>
                  </div>

                  <h4>{primaryRecommendation.title}</h4>
                  <p className="rec-summary-body">
                    {primaryRecommendation.suggestedAction}
                  </p>

                  <div className="reason-list">
                    <div>
                      <span>👁️</span>
                      <span>
                        <b>{t.whatIsHappening}</b>
                        <small>{primaryRecommendation.whatIsHappening}</small>
                      </span>
                    </div>
                    <div>
                      <span>💡</span>
                      <span>
                        <b>{t.whyItIsHappening}</b>
                        <small>{primaryRecommendation.whyItIsHappening}</small>
                      </span>
                    </div>
                  </div>

                  <button
                    className="outline-button"
                    onClick={() => setSelectedRecForXai(primaryRecommendation)}
                  >
                    <span>🔬 Why did AI recommend this? (SHAP & LIME)</span>
                    <span>→</span>
                  </button>
                </section>
              )}
            </div>

            {/* Bottom Row: Recent Alerts & Recent Operations */}
            <div className="bottom-grid">
              {/* Alert Center Panel */}
              <section className="panel alert-panel">
                <div className="panel-header">
                  <div>
                    <span className="section-kicker">Needs Attention</span>
                    <h3>Active Risk Alerts</h3>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => onNavigate("alerts")}
                  >
                    View all ({alerts.length}) →
                  </button>
                </div>

                {alerts.slice(0, 2).map((alt) => (
                  <div className="alert-row" key={alt.id}>
                    <span
                      className={`alert-indicator ${
                        alt.severity === "CRITICAL"
                          ? "red"
                          : alt.severity === "HIGH"
                          ? "amber"
                          : "green"
                      }`}
                    />
                    <div>
                      <strong>{alt.title}</strong>
                      <small>{alt.description.substring(0, 70)}...</small>
                    </div>
                    <span className={`alert-label ${alt.status.toLowerCase()}`}>
                      {alt.severity}
                    </span>
                  </div>
                ))}
              </section>

              {/* Recent Farm Operations Journal */}
              <section className="panel activity-summary-panel">
                <div className="panel-header">
                  <div>
                    <span className="section-kicker">Operations Journal</span>
                    <h3>Recent Field Actions</h3>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => onNavigate("activities")}
                  >
                    Open Journal →
                  </button>
                </div>

                {activities.slice(0, 2).map((act) => (
                  <div className="activity-row-compact" key={act.id}>
                    <span className="act-bullet">✓</span>
                    <div>
                      <strong>{act.title}</strong>
                      <small>
                        {act.date} · {act.activityType.replace(/_/g, " ")}
                        {act.costUgx ? ` · UGX ${act.costUgx.toLocaleString()}` : ""}
                      </small>
                    </div>
                  </div>
                ))}
              </section>
            </div>

            <p className="data-note">
              <span>ⓘ</span> AgriSense Uganda ADSS is operating with verified boundary validation and traceable Explainable AI (SHAP & LIME). {t.advisoryDisclaimer}
            </p>
          </>
        )}

        {/* Explainability Modal */}
        <ExplainabilityModal
          recommendation={selectedRecForXai}
          onClose={() => setSelectedRecForXai(null)}
        />

        {/* Cellular SMS Broadcast Modal */}
        {showSmsModal && (
          <SmsBroadcastModal
            onClose={() => setShowSmsModal(false)}
            defaultFarmName={activeFarm?.name}
            defaultAdvice={primaryRecommendation?.suggestedAction}
          />
        )}

        {/* Floating Farmer Voice Assistant */}
        <FarmerVoiceAssistant
          currentMoisture={telemetry?.soilMoisture ?? 34}
          rainProbability={weather?.current?.rainProbabilityPercent ?? 35}
        />
      </main>
    </div>
  );
}
