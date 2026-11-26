import { useCallback, useEffect, useState } from "react";
import { getDistrictFarms, getFarms } from "../services/firestoreService";
import { fetchFarmWeather } from "../services/weatherService";
import { getFollowUpCases, getLocalAssessmentHistory } from "../services/bctbAssessmentService";
import type { Farm } from "../types/farm";
import type { FarmWeatherSummary } from "../types/weather";
import type { BctbRiskResult } from "../types/bctb";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import type { AppPage } from "../types/navigation";
import ListenButton from "../components/ListenButton";
import type { FollowUpCase } from "../types/followUp";

export default function RecommendationsPage({ onNavigate }: { onNavigate?: (page: AppPage) => void }) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState("");
  const [weather, setWeather] = useState<FarmWeatherSummary | null>(null);
  const [screenings, setScreenings] = useState<BctbRiskResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [districtCases, setDistrictCases] = useState<FollowUpCase[]>([]);

  useEffect(() => {
    let active = true;
    (profile?.role === "AGRICULTURAL_OFFICER" ? getDistrictFarms(profile.assignedDistrict || "Mukono") : getFarms(user?.uid, profile?.organizationId)).then((farmList) => {
      if (!active) return;
      setFarms(farmList);
      setFarmId(farmList[0]?.id || "");
      if (!farmList.length) setLoading(false);
    }).catch(() => {
      if (active) {
        setMessage("Farm details could not be loaded. Check your connection and try again.");
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [user?.uid, profile?.organizationId, profile?.role, profile?.assignedDistrict]);

  const loadGuidance = useCallback(async () => {
    const farm = farms.find((item) => item.id === farmId);
    if (!farm) return;
    setLoading(true);
    setMessage("");
    try {
      const snapshot = await fetchFarmWeather(farm.location.latitude, farm.location.longitude, farm.district);
      setWeather(snapshot);
      if (profile?.role === "AGRICULTURAL_OFFICER") setDistrictCases(await getFollowUpCases(profile.assignedDistrict || "Mukono"));
      else setScreenings(getLocalAssessmentHistory().filter((result) => result.farmId === farm.id));
      if (snapshot.isFallback) setMessage("Showing saved or estimated weather because live weather data is unavailable.");
    } catch {
      setWeather(null);
      setMessage("Weather guidance is unavailable right now. Your farm and screening records are unchanged.");
    } finally {
      setLoading(false);
    }
  }, [farmId, farms, profile?.role, profile?.assignedDistrict]);

  useEffect(() => { void loadGuidance(); }, [loadGuidance]);

  const latestScreening = screenings[0];

  return (
    <section className="workspace-page recommendations-page">
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">{t.recEyebrow}</p>
          <h2>{t.recommendations}</h2>
          <p>{t.recSubheading}</p>
        </div>
        {farms.length > 0 && <label className="filter-group">{t.myFarms}
          <select value={farmId} onChange={(event) => setFarmId(event.target.value)}>
            {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
          </select>
        </label>}
      </div>

      <div className="settings-info-card">
        <strong>{profile?.role === "AGRICULTURAL_OFFICER" ? t.assignedAreaCard : t.whoSetsRecs}</strong> {profile?.role === "AGRICULTURAL_OFFICER" ? t.fieldVisitReminderText : t.whoSetsRecsAnswer}
        {onNavigate && <button className="text-button" type="button" onClick={() => onNavigate("help-room")}>{t.askAnOfficer} →</button>}
      </div>

      {message && <p className="settings-info-card">{message}</p>}
      {loading ? <div className="empty-workspace"><h3>{t.loadingBtn ?? "Loading..."}</h3></div> : !farms.length ? (
        <div className="empty-workspace"><h3>{t.registerFarm}</h3><p>{t.recSubheading}</p>{onNavigate && <button className="primary-button" onClick={() => onNavigate("farms")}>{t.registerFarm}</button>}</div>
      ) : weather ? (
        <>
          <div className="workspace-summary-grid">
            <article className="workspace-summary-card"><div><strong>{weather.indices.droughtRiskLevel} {t.drySpellsLabel}</strong><small>{t.regionalWeatherLabel} {weather.district}</small></div></article>
            <article className="workspace-summary-card"><div><strong>{weather.indices.heatStressRisk} {t.temperatureLabel}</strong><small>{t.regionalWeatherLabel}</small></div></article>
          </div>

          <div className="recommendations-list">
            <article className="recommendation-full-card">
              <h3 className="rec-card-title">{t.planAroundWeather}</h3>
              <p>{weather.indices.droughtRiskLevel === "HIGH" || weather.indices.droughtRiskLevel === "SEVERE"
                ? t.drySpellWarning
                : t.noDroughtRisk}</p>
              {weather.indices.fungalDiseaseRiskWindow && <p>{t.fungalDiseaseWarning}</p>}
              <ListenButton text={weather.indices.droughtRiskLevel === "HIGH" || weather.indices.droughtRiskLevel === "SEVERE"
                ? t.drySpellWarning
                : t.noDroughtRisk} />
            </article>

            {profile?.role === "AGRICULTURAL_OFFICER" ? <article className="recommendation-full-card">
              <h3 className="rec-card-title">Reports to consider for {farms.find((farm) => farm.id === farmId)?.name}</h3>
              {districtCases.filter((item) => item.farmId === farmId && item.status !== "resolved").length ? districtCases.filter((item) => item.farmId === farmId && item.status !== "resolved").map((item) => <div key={item.id}><p><strong>{item.riskLevel} screening · {item.status.replace(/_/g, " ")}</strong></p><p>Reported signs: {item.triggeredFactors.join(" · ") || "Review the farmer report for details."}</p><p>Recommended response: review the report, inspect affected twigs and surrounding trees, record findings, and give practical cultural guidance. Screening does not confirm infestation.</p><button className="text-button" type="button" onClick={() => onNavigate?.("extension")}>Open verification record →</button></div>) : <p>No open report is linked to this farm. Continue routine monitoring and use the Help Room for farmer questions.</p>}
            </article> : latestScreening ? <article className="recommendation-full-card">
              <h3 className="rec-card-title">Your latest BCTB screening: {latestScreening.riskLevel}</h3>
              <p>{latestScreening.explanation}</p>
              <p><strong>Suggested next steps:</strong> {latestScreening.safeAdvisory.join(" ") || latestScreening.nextSteps}</p>
              <ListenButton text={`${latestScreening.explanation} ${latestScreening.safeAdvisory.join(" ") || latestScreening.nextSteps}`} />
              <small>Recorded {new Date(latestScreening.createdAt).toLocaleString()}. Screening supports follow-up; it is not an official diagnosis.</small>
            </article> : <article className="recommendation-full-card">
              <h3 className="rec-card-title">Add a BCTB screening for tailored guidance</h3>
              <p>Answer questions about twig damage and farm practices to get a screening result and next steps.</p>
              {onNavigate && <button className="primary-button" type="button" onClick={() => onNavigate("bctb-assessment")}>Start a screening</button>}
            </article>}
          </div>
        </>
      ) : <div className="empty-workspace"><h3>Guidance is temporarily unavailable</h3><p>{message}</p><button type="button" className="primary-button" onClick={() => void loadGuidance()}>Try again</button></div>}
    </section>
  );
}
