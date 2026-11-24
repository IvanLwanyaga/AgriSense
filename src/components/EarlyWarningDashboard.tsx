import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import type { AppPage } from "../types/navigation";
import type { ResearchBctbPrediction, WeatherMetrics } from "../types/bctb";
import type { Farm } from "../types/farm";
import BctbAssessmentPage from "../pages/BctbAssessmentPage";
import Farms from "../pages/Farms";
import WeatherPage from "../pages/WeatherPage";
import ExtensionPage from "../pages/ExtensionPage";
import GovernancePage from "../pages/GovernancePage";
import RecommendationsPage from "../pages/RecommendationsPage";
import ActivitiesPage from "../pages/ActivitiesPage";
import AlertsPage from "../pages/AlertsPage";
import MapPage from "../pages/MapPage";
import HelpRoomPage from "../pages/HelpRoomPage";
import StaffApplicationsPage from "../pages/StaffApplicationsPage";
import AdminAccountManagementPage from "../pages/AdminAccountManagementPage";
import { SettingsPage } from "../pages/OperationsPage";
import AgriSenseChat from "./AgriSenseChat";
import CoffeePriceTicker from "./CoffeePriceTicker";
import FarmerVoiceAssistant from "./FarmerVoiceAssistant";
import FeedbackWidget from "./FeedbackWidget";
import FarmImpactCalculator from "./FarmImpactCalculator";
import FarmHealthRating from "./FarmHealthRating";
import CoffeePassportPage from "../pages/CoffeePassportPage";
import CooperativeSurveillancePage from "../pages/CooperativeSurveillancePage";
import SubscriptionPlansPage from "../pages/SubscriptionPlansPage";
import OrganizationManagementPage from "../pages/OrganizationManagementPage";
import { useAuth } from "../context/useAuth";
import { useLanguage, type SupportedLanguage, type TranslationDictionary } from "../context/LanguageContext";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import { useOfflineSync } from "../hooks/useOfflineSync";
import { getFarms } from "../services/firestoreService";
import { fetchBctbWeatherMetrics, fetchFarmWeather } from "../services/weatherService";
import { getLatestTelemetry } from "../services/iotService";
import { evaluateWeatherAlerts, recordBctbScreeningAlert } from "../services/alertService";
import { getFollowUpCases } from "../services/bctbAssessmentService";
import { getResearchScreeningJournal, type ResearchScreeningJournalEntry } from "../services/researchScreeningJournal";
import type { AgriSenseAiContext } from "../services/aiService";
import type { FollowUpCase } from "../types/followUp";

const ROLE_PAGES: Record<string, AppPage[]> = {
  FARMER: ["dashboard", "bctb-assessment", "help-room", "farms", "coffee-passport", "weather", "recommendations", "activities", "alerts", "subscription", "ai-assistant", "settings"],
  AGRICULTURAL_OFFICER: ["dashboard", "extension", "help-room", "farms", "map", "weather", "alerts", "subscription", "ai-assistant", "settings"],
  FARM_MANAGER: ["dashboard", "farms", "coffee-passport", "cooperative-surveillance", "organization-management", "bctb-assessment", "weather", "map", "recommendations", "activities", "alerts", "help-room", "subscription", "ai-assistant", "settings"],
  ORG_ADMIN: ["dashboard", "organization-management", "farms", "coffee-passport", "cooperative-surveillance", "extension", "help-room", "activities", "alerts", "recommendations", "subscription", "settings", "ai-assistant"],
  PLATFORM_ADMIN: ["dashboard", "organization-management", "staff-applications", "admin-accounts", "governance", "extension", "help-room", "farms", "alerts", "subscription", "settings"],
  VIEWER: ["dashboard", "governance", "weather", "map", "recommendations", "help-room", "subscription", "ai-assistant", "settings"],
};


function getNavLabel(item: AppPage, t: TranslationDictionary): { label: string; icon: string } {
  switch (item) {
    case "bctb-assessment":
      return { label: t.bctbScreening, icon: "◎" };
    case "help-room":
      return { label: t.helpRoom, icon: "💬" };
    case "farms":
      return { label: t.myFarms, icon: "🌱" };
    case "weather":
      return { label: t.farmWeather, icon: "🌦" };
    case "recommendations":
      return { label: t.recommendations, icon: "📋" };
    case "activities":
      return { label: t.activities, icon: "📔" };
    case "alerts":
      return { label: t.alerts, icon: "⚠️" };
    case "ai-assistant":
      return { label: t.aiAssistant, icon: "✨" };
    case "settings":
      return { label: t.settings, icon: "⚙️" };
    case "extension":
      return { label: t.extensionTriage, icon: "📋" };
    case "map":
      return { label: t.map, icon: "🗺" };
    case "governance":
      return { label: t.governanceRules, icon: "⚖️" };
    case "staff-applications":
      return { label: "Officer applications", icon: "✓" };
    case "admin-accounts":
      return { label: "Account management", icon: "🔐" };
    case "coffee-passport":
      return { label: "Coffee Passport", icon: "🧾" };
    case "cooperative-surveillance":
      return { label: "Cooperative surveillance", icon: "📊" };
    case "subscription":
      return { label: "Plans & Pricing", icon: "💎" };
    case "organization-management":
      return { label: "Cooperative Portal", icon: "🏢" };
    default:
      return { label: item, icon: "•" };
  }
}

export default function EarlyWarningDashboard({
  page,
  onNavigate,
  farmerName,
}: {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  farmerName: string;
}) {
  const { profile, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [latestResearchPrediction, setLatestResearchPrediction] = useState<ResearchBctbPrediction | null>(null);
  const syncStatus = useOfflineSync();
  const currentRole = profile?.role || "FARMER";
  const pages = ROLE_PAGES[currentRole] || ROLE_PAGES.FARMER;
  const roleName = currentRole.replace(/_/g, " ");

  // Run weather and screening checks when the workspace opens; this system does not require sensors.
  useEffect(() => {
    let cancelled = false;
    async function checkFarmAlerts() {
      if (!user?.uid || !["FARMER", "FARM_MANAGER", "ORG_ADMIN"].includes(currentRole)) return;
      try {
        const farms = await getFarms(user.uid, profile?.organizationId);
        for (const farm of farms) {
          const weather = await fetchFarmWeather(farm.location.latitude, farm.location.longitude, farm.district);
          if (!cancelled && !weather.isFallback) evaluateWeatherAlerts(farm.id, weather);
        }
        if (!cancelled) {
          const latestByFarm = new Map<string, ResearchScreeningJournalEntry>();
          for (const entry of getResearchScreeningJournal(user.uid)) {
            const farmId = entry.assessment.farmId;
            if (!farmId || !entry.prediction) continue;
            if (!latestByFarm.has(farmId)) latestByFarm.set(farmId, entry);
          }
          latestByFarm.forEach((entry) => {
            const prediction = entry.prediction!;
            recordBctbScreeningAlert({
              id: entry.id,
              farmId: entry.assessment.farmId,
              riskLevel: prediction.predicted_risk,
              safeAdvisory: prediction.actionable_steps,
              nextSteps: prediction.actionable_steps.join(" "),
              createdAt: entry.createdAt,
            });
          });
        }
      } catch (error) {
        console.warn("Automatic farm alert check could not finish:", error);
      }
    }
    void checkFarmAlerts();
    return () => { cancelled = true; };
  }, [user?.uid, profile?.organizationId, currentRole]);

  async function handleSignOut() {
    try {
      localStorage.removeItem("agrisense_current_profile");
      await signOut(auth);
    } catch {
      window.location.reload();
    }
  }

  const pageNavInfo = getNavLabel(page, t);
  const roleHubTitles: Record<string, string> = {
    FARMER: "Farm overview",
    AGRICULTURAL_OFFICER: "Officer hub",
    FARM_MANAGER: "Farm manager hub",
    ORG_ADMIN: "Cooperative hub",
    PLATFORM_ADMIN: "Administrator hub",
    VIEWER: "Research overview",
  };
  const pageTitle = page === "dashboard" ? roleHubTitles[currentRole] || "Overview" : pageNavInfo.label;
  const chatContext: AgriSenseAiContext & Record<string, unknown> = {
    userUid: user?.uid,
    role: currentRole,
    district: profile?.assignedDistrict || "Mukono",
    subCounty: profile?.assignedSubCounty || "Kyampisi",
    page,
    farmerName,
  };

  if (profile && profile.status !== "ACTIVE") {
    return <AccountReviewScreen name={farmerName} status={profile.status} applicationStatus={profile.applicationStatus} onSignOut={handleSignOut} />;
  }

  return (
    <Shell
      title={pageTitle}
      page={page}
      pages={pages}
      onNavigate={onNavigate}
      currentRole={roleName}
      onSignOut={handleSignOut}
      language={language}
      onLanguageChange={setLanguage}
      t={t}
      syncStatus={syncStatus}
    >
      {pages.includes(page) && page === "dashboard" && (
        <CoffeePriceTicker canEdit={currentRole === "PLATFORM_ADMIN"} />
      )}

      {!pages.includes(page) ? (
        <section className="panel role-access-denied">
          <h2>This workspace page is not assigned to your role level.</h2>
          <button className="primary-button" onClick={() => onNavigate("dashboard")}>
            Return to your dashboard
          </button>
        </section>
      ) : null}

      {pages.includes(page) && page === "dashboard" && (
        <RoleHome
          role={currentRole}
          farmerName={farmerName}
          latestResearchPrediction={latestResearchPrediction}
          onNavigate={onNavigate}
          t={t}
          userUid={user?.uid}
          district={profile?.assignedDistrict || "Mukono"}
          subCounty={profile?.assignedSubCounty || "Kyampisi"}
        />
      )}

      <FarmerVoiceAssistant />

      {pages.includes(page) && page === "help-room" && <HelpRoomPage />}
      {pages.includes(page) && page === "coffee-passport" && <CoffeePassportPage />}
      {pages.includes(page) && page === "cooperative-surveillance" && <CooperativeSurveillancePage />}
      {pages.includes(page) && page === "subscription" && <SubscriptionPlansPage />}
      {pages.includes(page) && page === "organization-management" && <OrganizationManagementPage />}
      {pages.includes(page) && page === "bctb-assessment" && <BctbAssessmentPage onResult={setLatestResearchPrediction} />}
      {pages.includes(page) && page === "farms" && <Farms />}
      {pages.includes(page) && page === "weather" && <WeatherPage />}
      {pages.includes(page) && page === "map" && <MapPage onNavigate={onNavigate} />}
      {pages.includes(page) && page === "recommendations" && <RecommendationsPage onNavigate={onNavigate} />}
      {pages.includes(page) && page === "activities" && <ActivitiesPage onNavigate={onNavigate} />}
      {pages.includes(page) && page === "alerts" && <AlertsPage />}
      {pages.includes(page) && page === "settings" && <SettingsPage />}
      {pages.includes(page) && page === "extension" && <ExtensionPage />}
      {pages.includes(page) && page === "governance" && <GovernancePage />}
      {pages.includes(page) && page === "staff-applications" && <StaffApplicationsPage />}
      {pages.includes(page) && page === "admin-accounts" && <AdminAccountManagementPage />}
      {pages.includes(page) && page === "ai-assistant" && (
        <AgriSenseChat context={chatContext} />
      )}
    </Shell>
  );
}

function FarmerScreeningChart({ userId }: { userId?: string }) {
  const history = (userId ? getResearchScreeningJournal(userId) : [])
    .filter((entry) => entry.prediction && Number.isFinite(Date.parse(entry.createdAt)))
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))
    .slice(-6)
    .map((entry) => {
      const prediction = entry.prediction!;
      return {
        id: entry.id,
        createdAt: entry.createdAt,
        riskLevel: prediction.predicted_risk,
        internalScore: Math.round(prediction.class_probabilities[prediction.predicted_risk] * 100),
      };
    });

  if (!history.length) {
    return (
      <div className="settings-info-card farmer-screening-chart-empty">
        <strong>Screening risk chart</strong>
        <p>Complete a BCTB screening to start tracking your risk history here.</p>
      </div>
    );
  }

  const chartPoints = history.map((record, index) => {
    const x = history.length === 1 ? 250 : 44 + index * (400 / (history.length - 1));
    const y = 132 - Math.max(0, Math.min(100, record.internalScore)) * 1.08;
    return { record, x, y };
  });
  const line = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const area = chartPoints.length
    ? `${chartPoints[0].x},132 ${line} ${chartPoints[chartPoints.length - 1].x},132`
    : "";

  return (
    <section className="farmer-screening-chart" aria-labelledby="farmer-screening-chart-title">
      <div className="farmer-screening-chart-heading">
        <div>
          <span className="section-kicker">Screening history</span>
          <h4 id="farmer-screening-chart-title">BCTB risk trend</h4>
        </div>
        <small>Latest {history.length} screenings</small>
      </div>
      <svg
        className="farmer-screening-chart-plot"
        viewBox="0 0 480 180"
        role="img"
        aria-label={`BCTB screening score trend. Latest result is ${history[history.length - 1].riskLevel} risk, score ${history[history.length - 1].internalScore} out of 100.`}
      >
        <defs>
          <linearGradient id="riskAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f9163" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3f9163" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 50, 100].map((score) => {
          const y = 132 - score * 1.08;
          return (
            <g key={score}>
              <line x1="38" x2="452" y1={y} y2={y} className="farmer-screening-chart-gridline" />
              <text x="30" y={y + 4} textAnchor="end" className="farmer-screening-chart-axis">{score}</text>
            </g>
          );
        })}
        <line x1="38" x2="452" y1="78" y2="78" className="farmer-screening-chart-target" />
        <text x="452" y="74" textAnchor="end" className="farmer-screening-chart-target-label">moderate</text>
        <polygon points={area} fill="url(#riskAreaGradient)" />
        <polyline points={line} className="farmer-screening-chart-line" />
        {chartPoints.map(({ record, x, y }) => (
          <g key={`${record.createdAt}-${record.id || record.internalScore}`}>
            <circle cx={x} cy={y} r="6" className={`farmer-screening-chart-point ${record.riskLevel.toLowerCase()}`} />
            <text x={x} y="160" textAnchor="middle" className="farmer-screening-chart-date">
              {new Date(record.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </text>
            <title>{`${record.riskLevel} risk, score ${record.internalScore}/100`}</title>
          </g>
        ))}
      </svg>
      <ul className="farmer-screening-chart-records" aria-label="Screening risk and score by date">
        {chartPoints.map(({ record }) => (
          <li key={`${record.createdAt}-${record.id || record.internalScore}`}>
            <time dateTime={record.createdAt}>
              {new Date(record.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </time>
            <strong className={`risk-text-${record.riskLevel.toLowerCase()}`}>{record.riskLevel}</strong>
            <span>{record.internalScore}/100</span>
          </li>
        ))}
      </ul>
      <div className="farmer-screening-chart-legend">
        <span><i className="low" />Low</span>
        <span><i className="moderate" />Moderate</span>
        <span><i className="high" />High</span>
        <small>Screening score is a risk indicator, not a diagnosis or yield-loss forecast.</small>
      </div>
    </section>
  );
}

function ScreeningOutcomeDonut({ entries }: { entries: ResearchScreeningJournalEntry[] }) {
  const predictions = entries
    .map((entry) => entry.prediction)
    .filter((prediction): prediction is ResearchBctbPrediction => Boolean(prediction));
  const counts = { LOW: 0, MODERATE: 0, HIGH: 0 };
  predictions.forEach((prediction) => {
    counts[prediction.predicted_risk] += 1;
  });
  const total = predictions.length;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { key: "LOW", label: "Low", color: "#3f9163", value: counts.LOW },
    { key: "MODERATE", label: "Moderate", color: "#d9a12b", value: counts.MODERATE },
    { key: "HIGH", label: "High", color: "#c95548", value: counts.HIGH },
  ];
  let offset = 0;

  return (
    <section className="panel donut-card">
      <div className="panel-header">
        <div>
          <span className="section-kicker">Screening outcomes</span>
          <h3>Risk mix</h3>
        </div>
      </div>
      {total === 0 ? (
        <div className="donut-empty">
          <strong>No screenings yet</strong>
          <p>Your low, moderate and high results will appear here after your first screening.</p>
        </div>
      ) : (
        <div className="donut-wrap">
          <svg
            viewBox="0 0 140 140"
            role="img"
            aria-label={`${total} screenings: ${counts.LOW} low, ${counts.MODERATE} moderate, ${counts.HIGH} high risk`}
          >
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef2ec" strokeWidth="18" />
            {segments.map((segment) => {
              const length = total ? (segment.value / total) * circumference : 0;
              const dash = `${length} ${circumference - length}`;
              const circle = (
                <circle
                  key={segment.key}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="18"
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 70 70)"
                />
              );
              offset += length;
              return circle;
            })}
            <text x="70" y="68" textAnchor="middle" className="donut-total">{total}</text>
            <text x="70" y="86" textAnchor="middle" className="donut-label">screenings</text>
          </svg>
          <ul className="donut-legend">
            {segments.map((segment) => (
              <li key={segment.key}>
                <i style={{ background: segment.color }} />
                <span>{segment.label}</span>
                <strong>{segment.value}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function RainfallCard({ weather }: { weather: WeatherMetrics | null }) {
  const points = weather
    ? [
        { label: "7 days", value: weather.cumulativeRainfall7dMm },
        { label: "14 days", value: weather.cumulativeRainfall14dMm },
        { label: "30 days", value: weather.cumulativeRainfall30dMm },
      ]
    : [];
  const max = Math.max(1, ...points.map((point) => point.value));

  return (
    <section className="panel rainfall-card">
      <div className="panel-header">
        <div>
          <span className="section-kicker">Rainfall</span>
          <h3>Recent totals</h3>
        </div>
      </div>
      {weather ? (
        <div className="rain-bars" role="img" aria-label="Rainfall totals for 7, 14 and 30 days">
          {points.map((point) => (
            <div className="rain-bar-col" key={point.label}>
              <span className="rain-bar-value">{Math.round(point.value)} mm</span>
              <span className="rain-bar-track">
                <span className="rain-bar-fill" style={{ height: `${Math.max(6, (point.value / max) * 100)}%` }} />
              </span>
              <small>{point.label}</small>
            </div>
          ))}
        </div>
      ) : (
        <p className="today-loading">Rainfall totals appear when weather data is available.</p>
      )}
    </section>
  );
}

function RoleHome({
  role,
  farmerName,
  latestResearchPrediction,
  onNavigate,
  t,
  userUid,
  district,
  subCounty,
}: {
  role: string;
  farmerName: string;
  latestResearchPrediction: ResearchBctbPrediction | null;
  onNavigate: (page: AppPage) => void;
  t: TranslationDictionary;
  userUid?: string;
  district: string;
  subCounty: string;
}) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [weather, setWeather] = useState<WeatherMetrics | null>(null);
  const [weatherError, setWeatherError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getFarms(userUid).then((loaded) => {
      if (isMounted) {
        setFarms(loaded);
        if (!loaded.length) setWeatherError(false);
      }
      if (loaded.length > 0) {
        const lat = loaded[0].location?.latitude || 0.3542;
        const lon = loaded[0].location?.longitude || 32.7531;
        fetchBctbWeatherMetrics(lat, lon, loaded[0].district || district, loaded[0].subCounty || subCounty)
          .then((wx) => {
            if (isMounted) setWeather(wx);
          })
          .catch(() => {
            if (isMounted) setWeatherError(true);
          });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userUid, district, subCounty, farms.length]);

  // FARMER ROLE VIEW
  if (role === "FARMER") {
    const firstName = farmerName.split(" ")[0];
    const telemetry = farms[0] ? getLatestTelemetry(farms[0].id) : null;
    const moistureState = telemetry
      ? telemetry.soilMoisture < 25
        ? "Dry"
        : telemetry.soilMoisture > 55
          ? "Wet"
          : "Adequate"
      : "No data";
    const tempState = telemetry
      ? telemetry.ambientTemperature >= 22 && telemetry.ambientTemperature <= 30
        ? "Comfortable"
        : "Check"
      : "No data";
    const humidityState = telemetry
      ? telemetry.relativeHumidity >= 50 && telemetry.relativeHumidity <= 85
        ? "Healthy"
        : "Check"
      : "No data";
    const journalEntries = userUid ? getResearchScreeningJournal(userUid) : [];
    const savedEntry = journalEntries.find((entry) => entry.prediction) ?? null;
    const sessionPrediction = latestResearchPrediction;
    const riskLabel = sessionPrediction
      ? `${sessionPrediction.predicted_risk.charAt(0)}${sessionPrediction.predicted_risk.slice(1).toLowerCase()} risk`
      : "";
    const riskProbability = sessionPrediction
      ? Math.round(sessionPrediction.class_probabilities[sessionPrediction.predicted_risk] * 100)
      : 0;
    const savedRiskLabel = savedEntry?.prediction
      ? `${savedEntry.prediction.predicted_risk.charAt(0)}${savedEntry.prediction.predicted_risk.slice(1).toLowerCase()} risk`
      : "";
    const savedDate = savedEntry
      ? new Date(savedEntry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "";
    const savedScore = savedEntry?.prediction
      ? Math.round(savedEntry.prediction.class_probabilities[savedEntry.prediction.predicted_risk] * 100)
      : 0;

    return (
      <div className="role-dashboard farmer-view">
        <section className="farmer-hero">
          <div className="farmer-hero-copy">
            <span className="section-kicker">Robusta coffee farmer hub</span>
            <h2>Welcome back, {firstName}</h2>
            <p>
              Check your coffee trees for twig borer, get clear next steps, and keep every farm
              record in one place.
            </p>
            <div className="farmer-hero-actions">
              <button className="primary-button btn-lg" type="button" onClick={() => onNavigate("bctb-assessment")}>
                {t.startScreeningBtn}
                <span aria-hidden="true">→</span>
              </button>
              <button className="outline-button btn-lg" type="button" onClick={() => onNavigate("help-room")}>
                {t.askAnOfficer}
              </button>
            </div>
            <div className="farmer-hero-meta">
              <span className="farm-pin">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {district} District{subCounty ? ` · ${subCounty} Sub-County` : ""}
              </span>
              <span>
                {farms.length} {farms.length === 1 ? "farm" : "farms"} registered
              </span>
            </div>
          </div>

          <aside className="today-card" aria-label="Today on your farm">
            <div className="today-card-head">
              <span className="section-kicker">Today on your farm</span>
              <span className="today-weather-icon" aria-hidden="true">☀</span>
            </div>
            {weather && weather.granularity !== "UNAVAILABLE" ? (
              <>
                <strong className="today-temp">{Math.round(weather.tempAvg30dC)}°C</strong>
                <p className="today-temp-label">average temperature, last 30 days</p>
                <dl className="today-stats">
                  <div>
                    <dt>Rain, 30 days</dt>
                    <dd>{Math.round(weather.cumulativeRainfall30dMm)} mm</dd>
                  </div>
                  <div>
                    <dt>Dry spell</dt>
                    <dd className={weather.consecutiveDrySpellDays >= 14 ? "is-warning" : ""}>
                      {weather.consecutiveDrySpellDays} days
                    </dd>
                  </div>
                </dl>
              </>
            ) : weatherError || (weather && weather.granularity === "UNAVAILABLE") ? (
              <p className="today-loading">Weather is unavailable right now. Try again later.</p>
            ) : farms.length === 0 ? (
              <p className="today-loading">
                Add your first farm to see local weather.{" "}
                <button className="text-button" type="button" onClick={() => onNavigate("farms")}>
                  Add a farm <span aria-hidden="true">→</span>
                </button>
              </p>
            ) : (
              <p className="today-loading">Loading your local weather…</p>
            )}
            <button className="text-button today-link" type="button" onClick={() => onNavigate("weather")}>
              See the full forecast <span aria-hidden="true">→</span>
            </button>
          </aside>
        </section>

        <section className="kpi-grid" aria-label="Farm conditions">
          <article className="kpi-card">
            <span className="kpi-icon kpi-icon--blue" aria-hidden="true">💧</span>
            <div className="kpi-copy">
              <span>Soil moisture</span>
              <strong>{telemetry ? `${Math.round(telemetry.soilMoisture)}%` : "—"}</strong>
              <small className={`kpi-state ${moistureState === "Adequate" ? "is-good" : "is-warn"}`}>{moistureState}</small>
            </div>
          </article>

          <article className="kpi-card">
            <span className="kpi-icon kpi-icon--amber" aria-hidden="true">🌡</span>
            <div className="kpi-copy">
              <span>Temperature</span>
              <strong>{telemetry ? `${telemetry.ambientTemperature.toFixed(1)}°C` : "—"}</strong>
              <small className={`kpi-state ${tempState === "Comfortable" ? "is-good" : "is-warn"}`}>{tempState}</small>
            </div>
          </article>

          <article className="kpi-card">
            <span className="kpi-icon kpi-icon--green" aria-hidden="true">💨</span>
            <div className="kpi-copy">
              <span>Humidity</span>
              <strong>{telemetry ? `${Math.round(telemetry.relativeHumidity)}%` : "—"}</strong>
              <small className={`kpi-state ${humidityState === "Healthy" ? "is-good" : "is-warn"}`}>{humidityState}</small>
            </div>
          </article>

          <article className="kpi-card">
            <span className="kpi-icon kpi-icon--clay" aria-hidden="true">🌧</span>
            <div className="kpi-copy">
              <span>Rain, 30 days</span>
              <strong>{weather ? `${Math.round(weather.cumulativeRainfall30dMm)} mm` : "—"}</strong>
              <small className="kpi-state">{weather ? "Regional weather" : "No data"}</small>
            </div>
          </article>
        </section>
        <p className="kpi-note">Demo sensor values until you connect your field device.</p>

        <section className="quick-grid" aria-label="Quick actions">
          <button className="quick-card" type="button" onClick={() => onNavigate("bctb-assessment")}>
            <span className="quick-icon quick-icon--green" aria-hidden="true">◎</span>
            <span className="quick-copy">
              <strong>Check my coffee</strong>
              <small>Seven quick questions about your twigs</small>
            </span>
            <span className="quick-arrow" aria-hidden="true">→</span>
          </button>

          <button className="quick-card" type="button" onClick={() => onNavigate("help-room")}>
            <span className="quick-icon quick-icon--amber" aria-hidden="true">💬</span>
            <span className="quick-copy">
              <strong>Ask an officer</strong>
              <small>Get advice from an extension officer</small>
            </span>
            <span className="quick-arrow" aria-hidden="true">→</span>
          </button>

          <button className="quick-card" type="button" onClick={() => onNavigate("farms")}>
            <span className="quick-icon quick-icon--clay" aria-hidden="true">🌱</span>
            <span className="quick-copy">
              <strong>{t.myFarms}</strong>
              <small>{farms.length} registered on your account</small>
            </span>
            <span className="quick-arrow" aria-hidden="true">→</span>
          </button>

          <button className="quick-card" type="button" onClick={() => onNavigate("weather")}>
            <span className="quick-icon quick-icon--blue" aria-hidden="true">☀</span>
            <span className="quick-copy">
              <strong>{t.farmWeather}</strong>
              <small>Rain and dry-spell outlook</small>
            </span>
            <span className="quick-arrow" aria-hidden="true">→</span>
          </button>
        </section>

        <div className="farmer-columns">
          <section className="panel farmer-latest">
            <div className="panel-header">
              <div>
                <span className="section-kicker">{t.currentScreening}</span>
                <h3>Your latest screening</h3>
              </div>
              {sessionPrediction ? (
                <span className={`risk-badge-sm ${sessionPrediction.predicted_risk.toLowerCase()}`}>
                  {riskProbability}% model score
                </span>
              ) : savedEntry ? (
                <span className={`risk-badge-sm ${savedEntry.prediction?.predicted_risk.toLowerCase() ?? "low"}`}>Saved result</span>
              ) : null}
            </div>

            {sessionPrediction ? (
              <>
                <div className="farmer-latest-riskline">
                  <strong className={`risk-text-${sessionPrediction.predicted_risk.toLowerCase()}`}>{riskLabel}</strong>
                  <span>Research model estimate</span>
                </div>
                <p>
                  This is an early warning based on your answers, not a diagnosis. Ask your
                  extension officer to confirm what is happening in your field.
                </p>
                {sessionPrediction.predicted_risk !== "LOW" && (
                  <button className="outline-button" type="button" onClick={() => onNavigate("help-room")}>
                    Ask an officer to review this
                  </button>
                )}
              </>
            ) : savedEntry ? (
              <>
                <div className="farmer-latest-riskline">
                  <strong className={`risk-text-${savedEntry.prediction?.predicted_risk.toLowerCase() ?? "low"}`}>{savedRiskLabel}</strong>
                  <span>Saved {savedDate} · score {savedScore}/100</span>
                </div>
                <p>
                  This is an early warning based on your answers, not a diagnosis. Ask your
                  extension officer to confirm what is happening in your field.
                </p>
                {savedEntry.prediction && savedEntry.prediction.predicted_risk !== "LOW" && (
                  <button className="outline-button" type="button" onClick={() => onNavigate("help-room")}>
                    Ask an officer to review this
                  </button>
                )}
              </>
            ) : (
              <div className="farmer-empty">
                <span className="farmer-empty-icon" aria-hidden="true">◎</span>
                <strong>No screening yet</strong>
                <p>Start a two-minute check to see your risk level and what to do next.</p>
              </div>
            )}

            <FarmerScreeningChart userId={userUid} />

            <div className="farmer-latest-actions">
              <button
                className={sessionPrediction || savedEntry ? "outline-button" : "primary-button"}
                type="button"
                onClick={() => onNavigate("bctb-assessment")}
              >
                {sessionPrediction || savedEntry ? t.updateAssessmentBtn : t.startScreeningBtn}
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <p className="fine-print">
              Screening is an early warning, not a diagnosis. Confirm with your sub-county
              agricultural extension officer.
            </p>
          </section>

          <section className="panel farmer-checklist">
            <span className="section-kicker">Cultural management standard</span>
            <h3>NARO BCTB sanitary checklist</h3>
            <ul className="checklist">
              <li>
                <span className="check" aria-hidden="true">✓</span>
                <div>
                  <strong>Prune</strong>
                  <p>Clip infested twigs 5 cm (2 inches) below the lowest beetle hole.</p>
                </div>
              </li>
              <li>
                <span className="check" aria-hidden="true">✓</span>
                <div>
                  <strong>Burn</strong>
                  <p>Collect clipped twigs in sacks and burn them off the farm.</p>
                </div>
              </li>
              <li>
                <span className="check" aria-hidden="true">✓</span>
                <div>
                  <strong>Desucker</strong>
                  <p>Remove excess water suckers growing from the stem base.</p>
                </div>
              </li>
              <li>
                <span className="check" aria-hidden="true">✓</span>
                <div>
                  <strong>Regulate shade</strong>
                  <p>Keep canopy at 30–40% filtered light for a healthy microclimate.</p>
                </div>
              </li>
            </ul>
            <button className="outline-button" type="button" onClick={() => onNavigate("activities")}>
              Record this work in my journal
            </button>
          </section>
        </div>

        <div className="farmer-insights">
          <ScreeningOutcomeDonut entries={journalEntries} />
          <RainfallCard weather={weather} />
          {farms.length > 0 && (
            <>
              <FarmImpactCalculator farms={farms} latestRisk={null} />
              <FarmHealthRating farms={farms} />
            </>
          )}
        </div>
      </div>
    );
  }

  // AGRICULTURAL OFFICER ROLE VIEW
  if (role === "AGRICULTURAL_OFFICER") {
    return <OfficerHome farmerName={farmerName} district={district} subCounty={subCounty} onNavigate={onNavigate} />;
  }

  // PLATFORM ADMIN ROLE VIEW
  if (role === "PLATFORM_ADMIN") {
    return (
      <div className="role-dashboard admin-view">
        <section className="role-welcome panel">
          <div>
            <span className="section-kicker">SYSTEM GOVERNANCE & TELEMETRY</span>
            <h2>Administrator Portal: {farmerName}</h2>
            <p>
              Oversee rule version governance, supervise extension casework, audit decision weights, and review system-wide telemetry.
            </p>
          </div>
          <span className="role-level-tag">Platform Administrator</span>
        </section>

        <section className="role-home-grid" style={{ marginBottom: 20 }}>
          <button
            className="role-home-card panel"
            type="button"
            onClick={() => onNavigate("governance")}
          >
            <span className="section-kicker">System Governance</span>
            <h3>⚖️ Rules & Model Registry</h3>
            <p>Audit expert rules v1.0.0, calibrate feature weights, and check safety guardrails.</p>
            <strong>Open Governance <span>→</span></strong>
          </button>

          <button
            className="role-home-card panel"
            type="button"
            onClick={() => onNavigate("extension")}
          >
            <span className="section-kicker">Operations</span>
            <h3>📋 Extension Operations</h3>
            <p>Review sub-county referral resolution rates and officer workload.</p>
            <strong>Open Casework <span>→</span></strong>
          </button>

          <button
            className="role-home-card panel"
            type="button"
            onClick={() => onNavigate("help-room")}
          >
            <span className="section-kicker">Community Moderation</span>
            <h3>💬 Help Room Supervision</h3>
            <p>Ensure farmer inquiries receive compliant, non-chemical advisory responses.</p>
            <strong>Supervise Help Room <span>→</span></strong>
          </button>
        </section>

        <div className="dashboard-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          <section className="panel">
            <span className="section-kicker">Rule Engine Status</span>
            <h3>Deterministic Expert Rules (v1.0.0)</h3>
            <p>Status: <span style={{ color: "#2e7d32", fontWeight: 600 }}>Active (Rule-Based Decision Support)</span></p>
            <p>Machine Learning Module: <span style={{ color: "#ed6c02", fontWeight: 600 }}>Locked in Production (Empirical NARO Dataset Collection Pending)</span></p>
            <small style={{ color: "#666" }}>Guardrail: Random Forest & Gradient Boosting models remain non-operational in live farmer triage until verified field ground truth is gathered.</small>
          </section>

          <section className="panel">
            <span className="section-kicker">Offline Storage & Cloud Sync</span>
            <h3>Local Storage Engine</h3>
            <p>Offline Assessment Queue: <strong>Active</strong></p>
            <p>Sync Trigger: <strong>Automatic on network reconnection</strong></p>
            <p>Firestore Targets: <code>/users</code>, <code>/farms</code>, <code>/assessments</code>, <code>/riskResults</code>, <code>/followUps</code>, <code>/helpQuestions</code></p>
          </section>
        </div>
      </div>
    );
  }

  // FARM MANAGER / ORG ADMIN VIEW
  return (
    <div className="role-dashboard manager-view">
      <section className="role-welcome panel">
        <div>
          <span className="section-kicker">COOPERATIVE & FARM OPERATIONS</span>
          <h2>Welcome, {farmerName}</h2>
          <p>Coordinate Robusta coffee operations, scout block conditions, and support member farmers.</p>
        </div>
        <span className="role-level-tag">{role.replace(/_/g, " ")}</span>
      </section>

      <section className="role-home-grid">
        <button className="role-home-card panel" type="button" onClick={() => onNavigate("farms")}>
          <span className="section-kicker">Portfolio</span>
          <h3>🌱 {t.myFarms}</h3>
          <p>Review all managed coffee plots, acreage, and varieties.</p>
          <strong>{t.viewFarms} <span>→</span></strong>
        </button>

        <button className="role-home-card panel" type="button" onClick={() => onNavigate("bctb-assessment")}>
          <span className="section-kicker">Screening</span>
          <h3>◎ {t.bctbScreening}</h3>
          <p>Screen coffee blocks and assess twig dieback incidence.</p>
          <strong>{t.startScreeningBtn} <span>→</span></strong>
        </button>

        <button className="role-home-card panel" type="button" onClick={() => onNavigate("help-room")}>
          <span className="section-kicker">Community</span>
          <h3>💬 {t.helpRoom}</h3>
          <p>Answer questions from member farmers and coordinate extension support.</p>
          <strong>Open Help Room <span>→</span></strong>
        </button>

        <button className="role-home-card panel" type="button" onClick={() => onNavigate("activities")}>
          <span className="section-kicker">Journal</span>
          <h3>📔 {t.activities}</h3>
          <p>Track sanitary pruning, desuckering, and shade regulation logs.</p>
          <strong>Open Journal <span>→</span></strong>
        </button>
      </section>
    </div>
  );
}

function AccountReviewScreen({
  name,
  status,
  applicationStatus,
  onSignOut,
}: {
  name: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  applicationStatus?: string;
  onSignOut: () => void;
}) {
  const rejected = applicationStatus === "REJECTED";
  return (
    <main className="account-review-screen">
      <section className="panel account-review-card">
        <span className={`account-review-icon ${rejected ? "rejected" : ""}`} aria-hidden="true">{rejected ? "!" : "…"}</span>
        <span className="section-kicker">AGRISENSE ACCOUNT</span>
        <h1>{rejected ? "Officer application not approved" : status === "PENDING" ? "Application under review" : "Account access paused"}</h1>
        <p>{rejected
          ? `Hi ${name.split(" ")[0]}, your officer application was not approved. Contact your cooperative or platform administrator if you think this is a mistake.`
          : status === "PENDING"
            ? `Thanks, ${name.split(" ")[0]}. An administrator needs to verify your organization, staff ID, and assigned area before officer tools are enabled.`
            : "An administrator has deactivated this account. Contact your AgriSense administrator for help."}</p>
        {status === "PENDING" && <div className="account-review-steps"><span>✓ Application received</span><span>2. Administrator review</span><span>3. Officer workspace activated</span></div>}
        <button type="button" className="outline-button" onClick={onSignOut}>Sign out</button>
      </section>
    </main>
  );
}

function OfficerHome({
  farmerName,
  district,
  subCounty,
  onNavigate,
}: {
  farmerName: string;
  district: string;
  subCounty: string;
  onNavigate: (page: AppPage) => void;
}) {
  const [cases, setCases] = useState<FollowUpCase[]>([]);
  const [casesUnavailable, setCasesUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    getFollowUpCases(district).then((loaded) => {
      if (!active) return;
      setCases(loaded);
      setCasesUnavailable(false);
    }).catch((error: unknown) => {
      console.error("Could not load live officer referrals.", error);
      if (active) setCasesUnavailable(true);
    });
    return () => { active = false; };
  }, [district]);

  const highRiskCount = cases.filter((item) => item.riskLevel === "HIGH" && item.status !== "resolved").length;
  const needsReviewCount = cases.filter((item) => item.status === "new").length;
  const completedCount = cases.filter((item) => item.status === "visited" || item.status === "resolved").length;
  const recentCases = [...cases]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <div className="role-dashboard officer-view">
      <section className="officer-hero panel">
        <div className="officer-hero-copy">
          <span className="section-kicker">AGRICULTURAL EXTENSION · {district.toUpperCase()} DISTRICT</span>
          <h2>Good morning, {farmerName.split(" ")[0]}</h2>
          <p>Your extension desk for farmer questions, BCTB referrals, and field follow-up in your assigned area.</p>
          <div className="officer-hero-actions">
            <button className="primary-button" type="button" onClick={() => onNavigate("extension")}>Open casework queue <span aria-hidden="true">→</span></button>
            <button className="outline-button" type="button" onClick={() => onNavigate("help-room")}>Answer farmer questions</button>
          </div>
        </div>
        <div className="officer-location-card">
          <span aria-hidden="true">⌖</span>
          <small>YOUR ASSIGNED AREA</small>
          <strong>{district} District</strong>
          {subCounty && <span>{subCounty} Sub-County</span>}
        </div>
      </section>

      <section className="officer-metrics" aria-label="Extension case summary">
        <article className="panel officer-metric"><span>Open referrals</span><strong>{cases.filter((item) => item.status !== "resolved").length}</strong><small>In your district queue</small></article>
        <article className="panel officer-metric attention"><span>High-risk cases</span><strong>{highRiskCount}</strong><small>Prioritize field verification</small></article>
        <article className="panel officer-metric"><span>Awaiting review</span><strong>{needsReviewCount}</strong><small>New farmer submissions</small></article>
        <article className="panel officer-metric"><span>Visits completed</span><strong>{completedCount}</strong><small>Visited or resolved</small></article>
      </section>

      <div className="officer-work-grid">
        <section className="panel officer-queue-panel">
          <header className="officer-section-heading">
            <div><span className="section-kicker">DISTRICT CASEWORK</span><h3>Recent referrals</h3></div>
            <button type="button" className="text-button" onClick={() => onNavigate("extension")}>View all <span aria-hidden="true">→</span></button>
          </header>
          {casesUnavailable && <p className="form-error" role="alert">Live referrals are unavailable. Check your connection before acting on casework.</p>}
          {recentCases.length ? <div className="officer-case-list">{recentCases.map((item) => (
            <article className="officer-case-row" key={item.id}>
              <span className={`officer-risk-dot ${item.riskLevel.toLowerCase()}`} aria-hidden="true" />
              <div className="officer-case-main"><strong>{item.farmerName}</strong><span>{item.subCounty}, {item.district}</span></div>
              <span className={`officer-case-risk ${item.riskLevel.toLowerCase()}`}>{item.riskLevel}</span>
              <span className="officer-case-status">{item.status.replace(/_/g, " ")}</span>
            </article>
          ))}</div> : <p className="officer-empty-state">No follow-up referrals are currently listed for {district}.</p>}
        </section>

        <section className="panel officer-tools-panel">
          <span className="section-kicker">FIELD TOOLS</span>
          <h3>Plan your next response</h3>
          <button type="button" className="officer-tool-link" onClick={() => onNavigate("help-room")}><span className="officer-tool-icon chat">☏</span><span><strong>Farmer Help Room</strong><small>Answer community questions and share guidance.</small></span><b aria-hidden="true">→</b></button>
          <button type="button" className="officer-tool-link" onClick={() => onNavigate("map")}><span className="officer-tool-icon map">⌖</span><span><strong>Farm & risk map</strong><small>Review farm locations and regional patterns.</small></span><b aria-hidden="true">→</b></button>
          <button type="button" className="officer-tool-link" onClick={() => onNavigate("weather")}><span className="officer-tool-icon weather">☼</span><span><strong>District weather</strong><small>Check rainfall and dry-spell conditions.</small></span><b aria-hidden="true">→</b></button>
        </section>
      </div>

      <section className="officer-protocol panel">
        <span className="section-kicker">FIELD VISIT REMINDER</span>
        <p>Screening results guide follow-up; confirm BCTB on-farm by inspecting affected twigs. Recommend approved cultural practices and avoid unregistered chemical treatments.</p>
      </section>
    </div>
  );
}

function Shell({
  title,
  page,
  pages,
  onNavigate,
  currentRole,
  onSignOut,
  language,
  onLanguageChange,
  t,
  syncStatus,
  children,
}: {
  title: string;
  page: AppPage;
  pages: AppPage[];
  onNavigate: (page: AppPage) => void;
  currentRole: string;
  onSignOut: () => void;
  language: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  t: TranslationDictionary;
  syncStatus: { isOnline: boolean; pendingCount: number; syncNow: () => Promise<{ syncedCount: number; remainingCount: number }> };
  children: ReactNode;
}) {
  const navItems = pages.filter((item) => item !== "dashboard");

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <span>AgriSense</span>
            <small className="brand-country">Robusta Coffee · Uganda</small>
          </div>
        </div>

        <p className="workspace-label">{currentRole} workspace</p>

        <nav className="nav-list" aria-label="AgriSense navigation">
          <NavButton active={page === "dashboard"} onClick={() => onNavigate("dashboard")} icon="⌂">
            {t.overview}
          </NavButton>

          {navItems.map((item) => {
            const navInfo = getNavLabel(item, t);
            return (
              <NavButton
                key={item}
                active={page === item}
                onClick={() => onNavigate(item)}
                icon={navInfo.icon}
              >
                {navInfo.label}
              </NavButton>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="signout-btn" onClick={onSignOut} type="button" aria-label={t.signOut}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 4H5v16h4" />
              <path d="M16 8l4 4-4 4" />
              <path d="M20 12H9" />
            </svg>
            <span className="signout-label">{t.signOut}</span>
          </button>
        </div>
      </aside>

      <main className="main-content" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <div>
            <p className="eyebrow">Explainable decision support · Robusta coffee</p>
            <h1>{title}</h1>
          </div>

          <div className="topbar-right">
            <div className="language-picker" title="Change application language">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
              </svg>
              <select
                className="language-select"
                value={language}
                onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)}
                aria-label="Workspace language"
              >
                <option value="en">English (EN)</option>
                <option value="lg">Luganda (LG)</option>
                <option value="sw">Kiswahili (SW)</option>
                <option value="nyn">Runyankole (NYN)</option>
              </select>
            </div>

            {syncStatus.isOnline ? (
              <span className="sync-pill sync-pill--online">
                <span className="dot" />
                {syncStatus.pendingCount > 0 ? (
                  <button type="button" className="sync-pill-action" onClick={() => void syncStatus.syncNow()}>
                    {syncStatus.pendingCount} to sync · Sync now
                  </button>
                ) : (
                  "Online"
                )}
              </span>
            ) : (
              <span className="sync-pill sync-pill--offline">
                <span className="dot" />
                Offline · {syncStatus.pendingCount} saved
              </span>
            )}

            <FeedbackWidget />
            <span className="user-role-pill">{currentRole}</span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  children: ReactNode;
}) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
      type="button"
      aria-current={active ? "page" : undefined}
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </button>
  );
}
