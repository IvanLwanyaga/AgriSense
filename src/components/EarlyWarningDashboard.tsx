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
import { evaluateWeatherAlerts, recordBctbScreeningAlert } from "../services/alertService";
import { getLocalAssessmentHistory } from "../services/bctbAssessmentService";
import { getFollowUpCases } from "../services/bctbAssessmentService";
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
          const latestByFarm = new Map<string, ReturnType<typeof getLocalAssessmentHistory>[number]>();
          for (const result of getLocalAssessmentHistory()) {
            if (result.farmId && !latestByFarm.has(result.farmId)) latestByFarm.set(result.farmId, result);
          }
          latestByFarm.forEach(recordBctbScreeningAlert);
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
  const pageTitle = page === "dashboard" ? `${farmerName.split(" ")[0]}'s ${currentRole === "FARMER" ? t.overview : roleName + " Hub"}` : pageNavInfo.label;

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
        <AgriSenseChat
          context={{
            userUid: user?.uid,
            role: currentRole,
            district: profile?.assignedDistrict || "Mukono",
            subCounty: profile?.assignedSubCounty || "Kyampisi",
            page,
            farmerName,
          } as any}
        />
      )}
    </Shell>
  );
}

function FarmerScreeningChart() {
  const history = getLocalAssessmentHistory()
    .filter((record) => Number.isFinite(Date.parse(record.createdAt)))
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))
    .slice(-6);

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
        {[0, 50, 100].map((score) => {
          const y = 132 - score * 1.08;
          return (
            <g key={score}>
              <line x1="38" x2="452" y1={y} y2={y} className="farmer-screening-chart-gridline" />
              <text x="30" y={y + 4} textAnchor="end" className="farmer-screening-chart-axis">{score}</text>
            </g>
          );
        })}
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

  useEffect(() => {
    let isMounted = true;
    getFarms(userUid).then((loaded) => {
      if (isMounted) setFarms(loaded);
      if (loaded.length > 0) {
        const lat = loaded[0].location?.latitude || 0.3542;
        const lon = loaded[0].location?.longitude || 32.7531;
        fetchBctbWeatherMetrics(lat, lon, loaded[0].district || district, loaded[0].subCounty || subCounty)
          .then((wx) => {
            if (isMounted) setWeather(wx);
          })
          .catch(() => {});
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userUid, district, subCounty]);

  // FARMER ROLE VIEW
  if (role === "FARMER") {
    return (
      <div className="role-dashboard farmer-view">
        {/* Welcome Banner */}
        <section className="role-welcome panel">
          <div>
            <span className="section-kicker">ROBUSTA COFFEE PRODUCER HUB</span>
            <h2>Welcome back, {farmerName.split(" ")[0]}!</h2>
            <p>
              Scout your coffee trees, record twig observations, and get safe non-chemical cultural mitigation guidance before damage spreads.
            </p>
          </div>
          <div className="location-chip">
            <span>📍 {district} District</span>
            {subCounty && <small>{subCounty} Sub-County</small>}
          </div>
        </section>

        {/* Quick Action Cards Grid */}
        <section className="role-home-grid" style={{ marginBottom: 20 }}>
          <button
            className="role-home-card panel"
            type="button"
            onClick={() => onNavigate("bctb-assessment")}
            style={{ borderLeft: "4px solid #1976d2" }}
          >
            <span className="section-kicker">Research model experiment</span>
            <h3>◎ {t.bctbScreening}</h3>
            <p>Submit the seven required observations to the synthetic-label Logistic Regression model. This is not a diagnosis.</p>
            <strong>{t.startScreeningBtn} <span>→</span></strong>
          </button>

          <button
            className="role-home-card panel"
            type="button"
            onClick={() => onNavigate("help-room")}
            style={{ borderLeft: "4px solid #ed6c02" }}
          >
            <span className="section-kicker">Extension Community</span>
            <h3>💬 {t.helpRoom}</h3>
            <p>Inquire directly from agricultural extension officers and lead farmers for guidance.</p>
            <strong>{t.askAnOfficer} <span>→</span></strong>
          </button>

          <button
            className="role-home-card panel"
            type="button"
            onClick={() => onNavigate("farms")}
            style={{ borderLeft: "4px solid #9c27b0" }}
          >
            <span className="section-kicker">Farm Register</span>
            <h3>🌱 {t.myFarms} ({farms.length})</h3>
            <p>Manage your coffee plots, tree counts, clonal varieties, and planting blocks.</p>
            <strong>{t.viewFarms} <span>→</span></strong>
          </button>
        </section>

        {/* Latest Screening Card */}
        <section className="panel farmer-latest-risk">
          <div className="panel-header">
            <div>
              <span className="section-kicker">{t.currentScreening}</span>
              <h3>{latestResearchPrediction
                ? `${latestResearchPrediction.predicted_risk} research-model prediction`
                : "No Research Model Prediction in this Session"}</h3>
            </div>
            {latestResearchPrediction && (
              <span className={`risk-badge-sm ${latestResearchPrediction.predicted_risk.toLowerCase()}`}>
                {(latestResearchPrediction.class_probabilities[latestResearchPrediction.predicted_risk] * 100).toFixed(1)}% model probability
              </span>
            )}
          </div>
          <p>
            {latestResearchPrediction
              ? "Research demonstration only: the model was trained on synthetic labels, not verified field outcomes. This is not a diagnosis."
              : "Run a research model prediction to see the model output here. It will not be used for treatment decisions."}
          </p>

          <FarmerScreeningChart />

          <FarmImpactCalculator farms={farms} latestRisk={null} />
          <FarmHealthRating farms={farms} />

          <div style={{ marginTop: 16 }}>
            <button className="primary-button" onClick={() => onNavigate("bctb-assessment")}>
              {latestResearchPrediction ? t.updateAssessmentBtn : t.startScreeningBtn} →
            </button>
          </div>
        </section>

        {/* Agro-Weather & Cultural Checklist Grid */}
        <div className="dashboard-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 16 }}>
          <section className="panel">
            <span className="section-kicker">Agro-Meteorological Radar</span>
            <h3>☀️ {t.farmWeather} ({district})</h3>
            {weather ? (
              <div className="weather-metric-chips" style={{ marginTop: 12 }}>
                <div className="wx-chip">
                  <small>Consecutive Dry Days</small>
                  <strong className={weather.consecutiveDrySpellDays >= 14 ? "warning-text" : ""}>
                    {weather.consecutiveDrySpellDays} days
                  </strong>
                </div>
                <div className="wx-chip">
                  <small>30-Day Rain</small>
                  <strong>{weather.cumulativeRainfall30dMm} mm</strong>
                </div>
                <div className="wx-chip">
                  <small>Mean Temp</small>
                  <strong>{weather.tempAvg30dC}°C</strong>
                </div>
              </div>
            ) : (
              <p style={{ marginTop: 8 }}>Loading weather context for your Robusta block...</p>
            )}
            <button className="outline-button-sm" style={{ marginTop: 12 }} onClick={() => onNavigate("weather")}>
              View 14-Day Detailed Forecast →
            </button>
          </section>

          <section className="panel">
            <span className="section-kicker">Cultural Management Standard</span>
            <h3>✂️ NARO BCTB Sanitary Checklist</h3>
            <ul style={{ paddingLeft: 20, margin: "8px 0", fontSize: "0.9rem", lineHeight: 1.6 }}>
              <li><strong>Pruning:</strong> Clip infested twigs 5cm (2 inches) below the lowest beetle hole.</li>
              <li><strong>Sanitation:</strong> Collect all clipped twigs in sacks immediately; burn off-field.</li>
              <li><strong>Desuckering:</strong> Remove excess water suckers from the stem base.</li>
              <li><strong>Shade:</strong> Regulate canopy to 30–40% filtered light.</li>
            </ul>
          </section>
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
            style={{ borderLeft: "4px solid #9c27b0" }}
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
            style={{ borderLeft: "4px solid #2e7d32" }}
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
            style={{ borderLeft: "4px solid #ed6c02" }}
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
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <span>AgriSense-BCTB</span>
            <small className="brand-country">Uganda · Robusta Coffee</small>
          </div>
        </div>

        <p className="workspace-label">{currentRole} {t.overview}</p>

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
          <button className="signout-btn" onClick={onSignOut} type="button">
            {t.signOut}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Explainable Decision Support · Robusta Coffee (Coffea canephora)</p>
            <h1>{title}</h1>
          </div>

          <div className="topbar-right">
            {/* Language Switcher */}
            <div className="workspace-language" title="Change application language" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span aria-hidden="true">🌐</span>
              <select
                value={language}
                onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)}
                aria-label="Workspace language"
                style={{ fontWeight: 600, padding: "4px 8px", borderRadius: 6, border: "1px solid #ccc" }}
              >
                <option value="en">English (EN)</option>
                <option value="lg">Luganda (LG)</option>
                <option value="sw">Kiswahili (SW)</option>
                <option value="nyn">Runyankole (NYN)</option>
              </select>
            </div>

            {/* Online / Offline Sync Indicator */}
            {syncStatus.isOnline ? (
              <span className="telemetry-badge" style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9" }}>
                <span className="dot" style={{ backgroundColor: "#2e7d32" }} />
                {syncStatus.pendingCount > 0 ? (
                  <button type="button" className="text-button" onClick={() => void syncStatus.syncNow()}>
                    {syncStatus.pendingCount} {t.syncPending} (Click to Sync)
                  </button>
                ) : (
                  t.onlineStatus
                )}
              </span>
            ) : (
              <span className="telemetry-badge" style={{ backgroundColor: "#fff3e0", color: "#e65100", border: "1px solid #ffe0b2" }}>
                <span className="dot" style={{ backgroundColor: "#e65100" }} />
                {t.offlineStatus} ({syncStatus.pendingCount} saved)
              </span>
            )}

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
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick} type="button">
      <span>{icon}</span>
      {children}
    </button>
  );
}
