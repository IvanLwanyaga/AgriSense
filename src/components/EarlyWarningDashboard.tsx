import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import type { AppPage } from "../types/navigation";
import type { ResearchBctbPrediction, WeatherMetrics } from "../types/bctb";
import type { Farm } from "../types/farm";
import BctbAssessmentPage from "../pages/BctbAssessmentPage";
import Farms from "../pages/Farms";
import ExtensionFarmDirectoryPage from "../pages/ExtensionFarmDirectoryPage";
import ExtensionWorkspace, { type ExtensionTab } from "../pages/ExtensionWorkspace";
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
import { getDistrictFarms, getFarms } from "../services/firestoreService";
import { refreshActiveRuleConfiguration } from "../services/bctbRuleConfig";
import { fetchBctbWeatherMetrics, fetchFarmWeather } from "../services/weatherService";
import { getLatestTelemetry } from "../services/iotService";
import { evaluateWeatherAlerts, recordBctbScreeningAlert } from "../services/alertService";
import { getFollowUpCases } from "../services/bctbAssessmentService";
import { getResearchScreeningJournal, type ResearchScreeningJournalEntry } from "../services/researchScreeningJournal";
import type { AgriSenseAiContext } from "../services/aiService";
import type { FollowUpCase } from "../types/followUp";

const ROLE_PAGES: Record<string, AppPage[]> = {
  FARMER: ["dashboard", "bctb-assessment", "help-room", "farms", "coffee-passport", "weather", "recommendations", "activities", "alerts", "subscription", "ai-assistant", "settings"],
  AGRICULTURAL_OFFICER: ["dashboard", "farms", "extension", "farm-reports", "verification", "inspections", "map", "help-room", "recommendations", "weather", "alerts", "subscription", "ai-assistant", "settings"],
  FARM_MANAGER: ["dashboard", "farms", "coffee-passport", "cooperative-surveillance", "organization-management", "bctb-assessment", "weather", "map", "recommendations", "activities", "alerts", "help-room", "subscription", "ai-assistant", "settings"],
  ORG_ADMIN: ["dashboard", "organization-management", "farms", "coffee-passport", "cooperative-surveillance", "extension", "help-room", "activities", "alerts", "recommendations", "subscription", "settings", "ai-assistant"],
  PLATFORM_ADMIN: ["dashboard", "organization-management", "staff-applications", "admin-accounts", "governance", "extension", "help-room", "farms", "alerts", "subscription", "settings"],
  VIEWER: ["dashboard", "governance", "weather", "map", "recommendations", "help-room", "subscription", "ai-assistant", "settings"],
};


function getNavLabel(item: AppPage, t: TranslationDictionary): { label: string; icon: string } {
  switch (item) {
    case "bctb-assessment":
      return { label: t.bctbScreening, icon: "\u25c9" };
    case "help-room":
      return { label: t.helpRoom, icon: "\u003f" };
    case "farms":
      return { label: t.myFarms, icon: "\u2698" };
    case "weather":
      return { label: t.farmWeather, icon: "\u2601" };
    case "recommendations":
      return { label: t.recommendations, icon: "\u25a4" };
    case "activities":
      return { label: t.activities, icon: "\u25a5" };
    case "alerts":
      return { label: t.alerts, icon: "\u0021" };
    case "ai-assistant":
      return { label: t.aiAssistant, icon: "\u2728" };
    case "settings":
      return { label: t.settings, icon: "\u2699" };
    case "extension":
      return { label: t.extensionTriage, icon: "\u2692" };
    case "farm-reports":
      return { label: t.navFarmReports, icon: "\u25a4" };
    case "verification":
      return { label: t.navVerification, icon: "\u2713" };
    case "inspections":
      return { label: t.navInspections, icon: "\u2714" };
    case "map":
      return { label: t.map, icon: "\u25a7" };
    case "governance":
      return { label: t.governanceRules, icon: "\u2696" };
    case "staff-applications":
      return { label: t.navOfficerApplications, icon: "\u2713" };
    case "admin-accounts":
      return { label: t.navAccountManagement, icon: "\u25a3" };
    case "coffee-passport":
      return { label: t.navCoffeePassport, icon: "\u25c8" };
    case "cooperative-surveillance":
      return { label: t.navCooperative, icon: "\u25a6" };
    case "subscription":
      return { label: t.navPlans, icon: "\u0024" };
    case "organization-management":
      return { label: t.navOrgPortal, icon: "\u2302" };
    default:
      return { label: item, icon: "\u2022" };
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
    FARMER: t.overview,
    AGRICULTURAL_OFFICER: t.extensionDeskKicker,
    FARM_MANAGER: t.overview,
    ORG_ADMIN: t.overview,
    PLATFORM_ADMIN: t.overview,
    VIEWER: t.overview,
  };
  const officerPageLabels: Partial<Record<AppPage, string>> = {
    farms: t.tabFarmersFarms,
    extension: t.extensionPortal,
    "farm-reports": t.tabFarmReports,
    verification: t.tabVerification,
    inspections: t.tabInspections,
    map: t.map,
    recommendations: t.tabRecommendations,
    settings: t.tabMyProfile,
  };
  const pageTitle = page === "dashboard" ? roleHubTitles[currentRole] || "Overview" : currentRole === "AGRICULTURAL_OFFICER" ? officerPageLabels[page] || pageNavInfo.label : pageNavInfo.label;
  const chatContext: AgriSenseAiContext & Record<string, unknown> = {
    userUid: user?.uid,
    role: currentRole,
    district: profile?.assignedDistrict || "Mukono",
    subCounty: profile?.assignedSubCounty || "Kyampisi",
    page,
    farmerName,
  };

  useEffect(() => {
    void refreshActiveRuleConfiguration().catch((error: unknown) => {
      console.warn("Could not refresh the shared BCTB rule configuration.", error);
    });
  }, [user?.uid]);

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
          <h2>{t.roleAccessDenied}</h2>
          <button className="primary-button" onClick={() => onNavigate("dashboard")}>
            {t.returnDashboard}
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
      {pages.includes(page) && page === "farms" && (currentRole === "AGRICULTURAL_OFFICER" ? <ExtensionFarmDirectoryPage onNavigate={onNavigate} /> : <Farms />)}
      {pages.includes(page) && page === "weather" && <WeatherPage />}
      {pages.includes(page) && page === "map" && <MapPage onNavigate={onNavigate} />}
      {pages.includes(page) && page === "recommendations" && <RecommendationsPage onNavigate={onNavigate} />}
      {pages.includes(page) && page === "activities" && <ActivitiesPage onNavigate={onNavigate} />}
      {pages.includes(page) && page === "alerts" && <AlertsPage />}
      {pages.includes(page) && page === "settings" && <SettingsPage />}
      {pages.includes(page) && page === "extension" && (currentRole === "AGRICULTURAL_OFFICER" ? <ExtensionWorkspace initialTab="overview" onNavigate={onNavigate} /> : <ExtensionPage />)}
      {currentRole === "AGRICULTURAL_OFFICER" && pages.includes(page) && ["farm-reports", "verification", "inspections"].includes(page) && (
        <ExtensionWorkspace initialTab={page as ExtensionTab} onNavigate={onNavigate} />
      )}
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
  const { language } = useLanguage();
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
    const riskProbability = sessionPrediction
      ? Math.round(sessionPrediction.class_probabilities[sessionPrediction.predicted_risk] * 100)
      : 0;
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
            <span className="section-kicker">{t.farmerHubKicker}</span>
            <h2>{t.welcomeBack}, {firstName}</h2>
            <p>{t.farmerHeroDesc}</p>
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
                {district} {t.districtWord}{subCounty ? ` · ${subCounty} ${t.subCountyWord}` : ""}
              </span>
              <span>
                {farms.length} {farms.length === 1 ? t.farmRegisteredCount : t.farmsRegisteredCount}
              </span>
            </div>
          </div>

          <aside className="today-card" aria-label={t.todayOnYourFarm}>
            <div className="today-card-head">
              <span className="section-kicker">{t.todayOnYourFarm}</span>
              <span className="today-weather-icon" aria-hidden="true">☀</span>
            </div>
            {weather && weather.granularity !== "UNAVAILABLE" ? (
              <>
                <strong className="today-temp">{Math.round(weather.tempAvg30dC)}°C</strong>
                <p className="today-temp-label">{t.avgTemp30dLabel}</p>
                <dl className="today-stats">
                  <div>
                    <dt>{t.rain30dLabel}</dt>
                    <dd>{Math.round(weather.cumulativeRainfall30dMm)} mm</dd>
                  </div>
                  <div>
                    <dt>{t.drySpellsLabel}</dt>
                    <dd className={weather.consecutiveDrySpellDays >= 14 ? "is-warning" : ""}>
                      {weather.consecutiveDrySpellDays} {language === "lg" ? "ennaku" : language === "sw" ? "siku" : language === "nyn" ? "ebiro" : "days"}
                    </dd>
                  </div>
                </dl>
              </>
            ) : weatherError || (weather && weather.granularity === "UNAVAILABLE") ? (
              <p className="today-loading">{t.stateNoData}</p>
            ) : farms.length === 0 ? (
              <p className="today-loading">
                {language === "lg" ? "Yongerako ennimiro yo esooka okulaba embeera y'obudde. " : language === "sw" ? "Ongeza shamba lako la kwanza kuona hali ya hewa. " : language === "nyn" ? "Taaho omusiri gwawe ogw'okubanza kureeba obwire. " : "Add your first farm to see local weather. "}
                <button className="text-button" type="button" onClick={() => onNavigate("farms")}>
                  {t.myFarms} <span aria-hidden="true">→</span>
                </button>
              </p>
            ) : (
              <p className="today-loading">{language === "lg" ? "Tutikka embeera y'obudde..." : language === "sw" ? "Inapakia hali ya hewa..." : language === "nyn" ? "Nikitwara obwire..." : "Loading your local weather…"}</p>
            )}
            <button className="text-button today-link" type="button" onClick={() => onNavigate("weather")}>
              {t.farmWeather} <span aria-hidden="true">→</span>
            </button>
          </aside>
        </section>

        <section className="kpi-grid" aria-label="Farm conditions">
          <article className="kpi-card">
            <span className="kpi-icon kpi-icon--blue" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3c-2 3.1-6 7.4-6 11a6 6 0 0 0 12 0c0-3.6-4-7.9-6-11Z"/><path d="M9 15a3 3 0 0 0 3 3"/></svg></span>
            <div className="kpi-copy">
              <span>{t.soilMoistureLabel}</span>
              <strong>{telemetry ? `${Math.round(telemetry.soilMoisture)}%` : "—"}</strong>
              <small className={`kpi-state ${moistureState === "Adequate" ? "is-good" : "is-warn"}`}>
                {moistureState === "Adequate" ? t.stateAdequate : moistureState === "Dry" ? t.stateDry : moistureState === "Wet" ? t.stateWet : t.stateNoData}
              </small>
            </div>
          </article>

          <article className="kpi-card">
            <span className="kpi-icon kpi-icon--amber" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4.5 4.5 0 1 0 4 0Z"/><path d="M12 17V8"/></svg></span>
            <div className="kpi-copy">
              <span>{t.temperatureLabel}</span>
              <strong>{telemetry ? `${telemetry.ambientTemperature.toFixed(1)}°C` : "—"}</strong>
              <small className={`kpi-state ${tempState === "Comfortable" ? "is-good" : "is-warn"}`}>
                {tempState === "Comfortable" ? t.stateComfortable : tempState === "Check" ? t.stateCheck : t.stateNoData}
              </small>
            </div>
          </article>

          <article className="kpi-card">
            <span className="kpi-icon kpi-icon--green" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></svg></span>
            <div className="kpi-copy">
              <span>{t.humidityLabel}</span>
              <strong>{telemetry ? `${Math.round(telemetry.relativeHumidity)}%` : "—"}</strong>
              <small className={`kpi-state ${humidityState === "Healthy" ? "is-good" : "is-warn"}`}>
                {humidityState === "Healthy" ? t.stateHealthy : humidityState === "Check" ? t.stateCheck : t.stateNoData}
              </small>
            </div>
          </article>

          <article className="kpi-card">
            <span className="kpi-icon kpi-icon--clay" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 16a4 4 0 1 1 .8-7.9A5.5 5.5 0 0 1 18 10a3 3 0 1 1 0 6H7Z"/><path d="m9 18-1 2m6-2-1 2m6-2-1 2"/></svg></span>
            <div className="kpi-copy">
              <span>{t.rain30dKpi}</span>
              <strong>{weather ? `${Math.round(weather.cumulativeRainfall30dMm)} mm` : "—"}</strong>
              <small className="kpi-state">{weather ? t.regionalWeatherLabel : t.stateNoData}</small>
            </div>
          </article>
        </section>
        <p className="kpi-note">{t.demoSensorNote}</p>

        <section className="quick-grid" aria-label={t.quickActions}>
          <button className="quick-card" type="button" onClick={() => onNavigate("bctb-assessment")}>
            <span className="quick-icon quick-icon--green" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5M8.5 11h5M11 8.5v5"/></svg></span>
            <span className="quick-copy">
              <strong>{t.quickCheckCoffeeTitle}</strong>
              <small>{t.quickCheckCoffeeDesc}</small>
            </span>
            <span className="quick-arrow" aria-hidden="true">→</span>
          </button>

          <button className="quick-card" type="button" onClick={() => onNavigate("help-room")}>
            <span className="quick-icon quick-icon--amber" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 9h8m-8 4h5"/></svg></span>
            <span className="quick-copy">
              <strong>{t.quickAskOfficerTitle}</strong>
              <small>{t.quickAskOfficerDesc}</small>
            </span>
            <span className="quick-arrow" aria-hidden="true">→</span>
          </button>

          <button className="quick-card" type="button" onClick={() => onNavigate("farms")}>
            <span className="quick-icon quick-icon--clay" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 4C10 4 5 8 5 15c0 3 2 5 5 5 7 0 11-6 10-16Z"/><path d="M4 21c3-5 7-8 12-11"/></svg></span>
            <span className="quick-copy">
              <strong>{t.myFarms}</strong>
              <small>{farms.length} {t.quickMyFarmsDesc}</small>
            </span>
            <span className="quick-arrow" aria-hidden="true">→</span>
          </button>

          <button className="quick-card" type="button" onClick={() => onNavigate("weather")}>
            <span className="quick-icon quick-icon--blue" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg></span>
            <span className="quick-copy">
              <strong>{t.farmWeather}</strong>
              <small>{t.quickFarmWeatherDesc}</small>
            </span>
            <span className="quick-arrow" aria-hidden="true">→</span>
          </button>
        </section>

        <div className="farmer-columns">
          <section className="panel farmer-latest">
            <div className="panel-header">
              <div>
                <span className="section-kicker">{t.currentScreening}</span>
                <h3>{t.yourLatestScreening}</h3>
              </div>
              {sessionPrediction ? (
                <span className={`risk-badge-sm ${sessionPrediction.predicted_risk.toLowerCase()}`}>
                  {riskProbability}% {t.modelScoreText}
                </span>
              ) : savedEntry ? (
                <span className={`risk-badge-sm ${savedEntry.prediction?.predicted_risk.toLowerCase() ?? "low"}`}>{t.savedResultText}</span>
              ) : null}
            </div>

            {sessionPrediction ? (
              <>
                <div className="farmer-latest-riskline">
                  <strong className={`risk-text-${sessionPrediction.predicted_risk.toLowerCase()}`}>
                    {sessionPrediction.predicted_risk === "HIGH" ? t.riskHighHeading : sessionPrediction.predicted_risk === "MODERATE" ? t.riskModerateHeading : t.riskLowHeading}
                  </strong>
                  <span>{t.researchModelEstimate}</span>
                </div>
                <p>{t.screeningWarningText}</p>
                {sessionPrediction.predicted_risk !== "LOW" && (
                  <button className="outline-button" type="button" onClick={() => onNavigate("help-room")}>
                    {t.askOfficerReviewBtn}
                  </button>
                )}
              </>
            ) : savedEntry ? (
              <>
                <div className="farmer-latest-riskline">
                  <strong className={`risk-text-${savedEntry.prediction?.predicted_risk.toLowerCase() ?? "low"}`}>
                    {savedEntry.prediction?.predicted_risk === "HIGH" ? t.riskHighHeading : savedEntry.prediction?.predicted_risk === "MODERATE" ? t.riskModerateHeading : t.riskLowHeading}
                  </strong>
                  <span>{t.savedResultText} {savedDate} · {savedScore}/100</span>
                </div>
                <p>{t.screeningWarningText}</p>
                {savedEntry.prediction && savedEntry.prediction.predicted_risk !== "LOW" && (
                  <button className="outline-button" type="button" onClick={() => onNavigate("help-room")}>
                    {t.askOfficerReviewBtn}
                  </button>
                )}
              </>
            ) : (
              <div className="farmer-empty">
                <span className="farmer-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5M8.5 11h5M11 8.5v5"/></svg></span>
                <strong>{t.noScreeningTitle}</strong>
                <p>{t.noScreeningDesc}</p>
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

            <p className="fine-print">{t.finePrintWarning}</p>
          </section>

          <section className="panel farmer-checklist">
            <span className="section-kicker">{t.culturalStandardKicker}</span>
            <h3>{t.naroChecklistTitle}</h3>
            <ul className="checklist">
              <li>
                <span className="check" aria-hidden="true">✓</span>
                <div>
                  <strong>{t.pruneTitle}</strong>
                  <p>{t.pruneDesc}</p>
                </div>
              </li>
              <li>
                <span className="check" aria-hidden="true">✓</span>
                <div>
                  <strong>{t.burnTitle}</strong>
                  <p>{t.burnDesc}</p>
                </div>
              </li>
              <li>
                <span className="check" aria-hidden="true">✓</span>
                <div>
                  <strong>{t.desuckerTitle}</strong>
                  <p>{t.desuckerDesc}</p>
                </div>
              </li>
              <li>
                <span className="check" aria-hidden="true">✓</span>
                <div>
                  <strong>{t.shadeTitle}</strong>
                  <p>{t.shadeDesc}</p>
                </div>
              </li>
            </ul>
            <button className="outline-button" type="button" onClick={() => onNavigate("activities")}>
              {t.recordJournalBtn}
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
            <h3>âš–ï¸ Rules & Model Registry</h3>
            <p>Audit expert rules v1.0.0, calibrate feature weights, and check safety guardrails.</p>
            <strong>Open Governance <span>â†’</span></strong>
          </button>

          <button
            className="role-home-card panel"
            type="button"
            onClick={() => onNavigate("extension")}
          >
            <span className="section-kicker">Operations</span>
            <h3>ðŸ“‹ Extension Operations</h3>
            <p>Review sub-county referral resolution rates and officer workload.</p>
            <strong>Open Casework <span>â†’</span></strong>
          </button>

          <button
            className="role-home-card panel"
            type="button"
            onClick={() => onNavigate("help-room")}
          >
            <span className="section-kicker">Community Moderation</span>
            <h3>ðŸ’¬ Help Room Supervision</h3>
            <p>Ensure farmer inquiries receive compliant, non-chemical advisory responses.</p>
            <strong>Supervise Help Room <span>â†’</span></strong>
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
          <h3>ðŸŒ± {t.myFarms}</h3>
          <p>Review all managed coffee plots, acreage, and varieties.</p>
          <strong>{t.viewFarms} <span>â†’</span></strong>
        </button>

        <button className="role-home-card panel" type="button" onClick={() => onNavigate("bctb-assessment")}>
          <span className="section-kicker">Screening</span>
          <h3>â—Ž {t.bctbScreening}</h3>
          <p>Screen coffee blocks and assess twig dieback incidence.</p>
          <strong>{t.startScreeningBtn} <span>â†’</span></strong>
        </button>

        <button className="role-home-card panel" type="button" onClick={() => onNavigate("help-room")}>
          <span className="section-kicker">Community</span>
          <h3>ðŸ’¬ {t.helpRoom}</h3>
          <p>Answer questions from member farmers and coordinate extension support.</p>
          <strong>Open Help Room <span>â†’</span></strong>
        </button>

        <button className="role-home-card panel" type="button" onClick={() => onNavigate("activities")}>
          <span className="section-kicker">Journal</span>
          <h3>ðŸ“” {t.activities}</h3>
          <p>Track sanitary pruning, desuckering, and shade regulation logs.</p>
          <strong>Open Journal <span>â†’</span></strong>
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
        <span className={`account-review-icon ${rejected ? "rejected" : ""}`} aria-hidden="true">{rejected ? "!" : "â€¦"}</span>
        <span className="section-kicker">AGRISENSE ACCOUNT</span>
        <h1>{rejected ? "Officer application not approved" : status === "PENDING" ? "Application under review" : "Account access paused"}</h1>
        <p>{rejected
          ? `Hi ${name.split(" ")[0]}, your officer application was not approved. Contact your cooperative or platform administrator if you think this is a mistake.`
          : status === "PENDING"
            ? `Thanks, ${name.split(" ")[0]}. An administrator needs to verify your organization, staff ID, and assigned area before officer tools are enabled.`
            : "An administrator has deactivated this account. Contact your AgriSense administrator for help."}</p>
        {status === "PENDING" && <div className="account-review-steps"><span>âœ“ Application received</span><span>2. Administrator review</span><span>3. Officer workspace activated</span></div>}
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
  const { t } = useLanguage();
  const [cases, setCases] = useState<FollowUpCase[]>([]);
  const [casesUnavailable, setCasesUnavailable] = useState(false);
  const [assignedFarmers, setAssignedFarmers] = useState(0);

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

  useEffect(() => {
    let active = true;
    getDistrictFarms(district).then((farms) => {
      if (active) setAssignedFarmers(new Set(farms.map((farm) => farm.farmerId)).size);
    }).catch((error: unknown) => console.warn("Could not load assigned farmer count.", error));
    return () => { active = false; };
  }, [district]);

  const highRiskCount = cases.filter((item) => item.riskLevel === "HIGH" && item.status !== "resolved").length;
  const needsReviewCount = cases.filter((item) => item.status === "new").length;
  const completedCount = cases.filter((item) => item.status === "visited" || item.status === "resolved").length;
  const verifiedCount = cases.filter((item) => item.verifiedObservation === "confirmed_bctb" || item.verifiedObservation === "not_confirmed" || item.verifiedObservation === "other_pest_or_condition").length;
  const recentCases = [...cases]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <div className="role-dashboard officer-view">
      <section className="officer-hero panel">
        <div className="officer-hero-copy">
          <span className="section-kicker">{t.extensionDeskKicker} {district.toUpperCase()} {t.districtWord}</span>
          <h2>{t.goodMorningOfficer} {farmerName.split(" ")[0]}</h2>
          <p>{t.officerHeroDesc}</p>
          <div className="officer-hero-actions">
            <button className="primary-button" type="button" onClick={() => onNavigate("extension")}>{t.openCaseworkQueue}</button>
            <button className="outline-button" type="button" onClick={() => onNavigate("help-room")}>{t.answerFarmerQuestions}</button>
          </div>
        </div>
        <div className="officer-location-card">
          <span aria-hidden="true">âŒ–</span>
          <small>{t.assignedAreaCard}</small>
          <strong>{district} {t.districtWord}</strong>
          {subCounty && <span>{subCounty} {t.subCountyWord}</span>}
        </div>
      </section>

      <section className="officer-metrics" aria-label="Extension case summary">
        <article className="panel officer-metric"><span>{t.assignedFarmersMetric}</span><strong>{assignedFarmers}</strong><small>{t.assignedFarmersHelp}</small></article>
        <article className="panel officer-metric attention"><span>{t.highRiskCasesMetric}</span><strong>{highRiskCount}</strong><small>{t.highRiskCasesHelp}</small></article>
        <article className="panel officer-metric"><span>{t.reportsToReviewMetric}</span><strong>{needsReviewCount}</strong><small>{t.reportsToReviewHelp}</small></article>
        <article className="panel officer-metric"><span>{t.verifiedReportsMetric}</span><strong>{verifiedCount}</strong><small>{t.verifiedReportsHelp} Â· {completedCount} visits</small></article>
      </section>

      <div className="officer-work-grid">
        <section className="panel officer-queue-panel">
          <header className="officer-section-heading">
            <div><span className="section-kicker">{t.districtCaseworkKicker}</span><h3>{t.recentReferralsTitle}</h3></div>
            <button type="button" className="text-button" onClick={() => onNavigate("extension")}>{t.viewAllCasework}</button>
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
          <span className="section-kicker">{t.fieldToolsKicker}</span>
          <h3>{t.planNextResponseTitle}</h3>
          <button type="button" className="officer-tool-link" onClick={() => onNavigate("help-room")}><span className="officer-tool-icon chat">â˜</span><span><strong>{t.helpRoom}</strong><small>{t.helpRoomSubheading}</small></span><b aria-hidden="true">â†’</b></button>
          <button type="button" className="officer-tool-link" onClick={() => onNavigate("map")}><span className="officer-tool-icon map">âŒ–</span><span><strong>{t.map}</strong><small>{t.farmsAndFields}</small></span><b aria-hidden="true">â†’</b></button>
          <button type="button" className="officer-tool-link" onClick={() => onNavigate("weather")}><span className="officer-tool-icon weather">â˜¼</span><span><strong>{t.farmWeather}</strong><small>{t.weatherIntel}</small></span><b aria-hidden="true">â†’</b></button>
        </section>
      </div>

      <section className="officer-protocol panel">
        <span className="section-kicker">{t.fieldVisitReminderKicker}</span>
        <p>{t.fieldVisitReminderText}</p>
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
            <small className="brand-country">Robusta Coffee Â· Uganda</small>
          </div>
        </div>

        <p className="workspace-label">{currentRole === "FARMER" ? t.roleFarmerText : currentRole === "AGRICULTURAL_OFFICER" ? t.roleOfficerText : currentRole} {t.workspaceLabel}</p>

        <nav className="nav-list" aria-label="AgriSense navigation">
          <NavButton active={page === "dashboard"} onClick={() => onNavigate("dashboard")} icon={<svg className="nav-overview-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.5"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/></svg>}>
            {t.overview}
          </NavButton>

          {navItems.map((item) => {
            const navInfo = getNavLabel(item, t);
            const officerNavLabel: Partial<Record<AppPage, string>> = {
              farms: t.tabFarmersFarms,
              extension: t.extensionPortal,
              "farm-reports": t.tabFarmReports,
              verification: t.tabVerification,
              inspections: t.tabInspections,
              map: t.map,
              recommendations: t.tabRecommendations,
              settings: t.tabMyProfile,
            };
            return (
              <NavButton
                key={item}
                active={page === item}
                onClick={() => onNavigate(item)}
                icon={navInfo.icon}
              >
                {currentRole === "AGRICULTURAL_OFFICER" ? officerNavLabel[item] || navInfo.label : navInfo.label}
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
            <p className="eyebrow">{t.eyebrowText}</p>
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
                    {syncStatus.pendingCount} {t.toSyncPill} Â· {t.syncNowPill}
                  </button>
                ) : (
                  t.onlinePill
                )}
              </span>
            ) : (
              <span className="sync-pill sync-pill--offline">
                <span className="dot" />
                {t.offlinePill} Â· {syncStatus.pendingCount}
              </span>
            )}

            <FeedbackWidget />
            <span className="user-role-pill">{currentRole === "FARMER" ? t.roleFarmerText : currentRole === "AGRICULTURAL_OFFICER" ? t.roleOfficerText : currentRole}</span>
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
  icon: ReactNode;
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
      <span className="nav-item-label">{children}</span>
    </button>
  );
}
