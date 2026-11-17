import { useCallback, useEffect, useState } from "react";
import { getFarms } from "../services/firestoreService";
import { fetchFarmWeather } from "../services/weatherService";
import { getLocalAssessmentHistory } from "../services/bctbAssessmentService";
import type { Farm } from "../types/farm";
import type { FarmWeatherSummary } from "../types/weather";
import type { BctbRiskResult } from "../types/bctb";
import { useAuth } from "../context/useAuth";
import type { AppPage } from "../types/navigation";
import ListenButton from "../components/ListenButton";

export default function RecommendationsPage({ onNavigate }: { onNavigate?: (page: AppPage) => void }) {
  const { user, profile } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState("");
  const [weather, setWeather] = useState<FarmWeatherSummary | null>(null);
  const [screenings, setScreenings] = useState<BctbRiskResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    getFarms(user?.uid, profile?.organizationId).then((farmList) => {
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
  }, [user?.uid, profile?.organizationId]);

  const loadGuidance = useCallback(async () => {
    const farm = farms.find((item) => item.id === farmId);
    if (!farm) return;
    setLoading(true);
    setMessage("");
    try {
      const snapshot = await fetchFarmWeather(farm.location.latitude, farm.location.longitude, farm.district);
      setWeather(snapshot);
      setScreenings(getLocalAssessmentHistory().filter((result) => result.farmId === farm.id));
      if (snapshot.isFallback) setMessage("Showing saved or estimated weather because live weather data is unavailable.");
    } catch {
      setWeather(null);
      setMessage("Weather guidance is unavailable right now. Your farm and screening records are unchanged.");
    } finally {
      setLoading(false);
    }
  }, [farmId, farms]);

  useEffect(() => { void loadGuidance(); }, [loadGuidance]);

  const latestScreening = screenings[0];

  return (
    <section className="workspace-page recommendations-page">
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">Farm and weather guidance</p>
          <h2>Recommendations</h2>
          <p>Guidance is based on local weather and your recorded BCTB screening. AgriSense does not need farm sensors.</p>
        </div>
        {farms.length > 0 && <label className="filter-group">Farm
          <select value={farmId} onChange={(event) => setFarmId(event.target.value)}>
            {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
          </select>
        </label>}
      </div>

      <div className="settings-info-card">
        <strong>Who sets these recommendations?</strong> Weather guidance is generated automatically from the forecast. BCTB screening guidance comes from your answers. An agricultural officer provides personalized advice and verifies findings in the Help Room or during a farm visit.
        {onNavigate && <button className="text-button" type="button" onClick={() => onNavigate("help-room")}>Ask an extension officer →</button>}
      </div>

      {message && <p className="settings-info-card">{message}</p>}
      {loading ? <div className="empty-workspace"><h3>Loading farm guidance…</h3></div> : !farms.length ? (
        <div className="empty-workspace"><h3>Add a farm to see local guidance</h3><p>Weather recommendations use the farm’s saved location.</p>{onNavigate && <button className="primary-button" onClick={() => onNavigate("farms")}>Set up a farm</button>}</div>
      ) : weather ? (
        <>
          <div className="workspace-summary-grid">
            <article className="workspace-summary-card"><div><strong>{weather.indices.droughtRiskLevel} dry-spell risk</strong><small>Weather estimate for {weather.district}</small></div></article>
            <article className="workspace-summary-card"><div><strong>{weather.indices.heatStressRisk} heat risk</strong><small>Based on current local weather</small></div></article>
          </div>

          <div className="recommendations-list">
            <article className="recommendation-full-card">
              <h3 className="rec-card-title">Plan around the local weather</h3>
              <p>{weather.indices.droughtRiskLevel === "HIGH" || weather.indices.droughtRiskLevel === "SEVERE"
                ? "A dry spell is expected. Check the soil and trees directly, conserve moisture with suitable mulch, and discuss water planning with an extension officer."
                : "No high drought risk is indicated in the current weather estimate. Continue checking the soil and crop directly because weather data cannot measure moisture in your field."}</p>
              {weather.indices.fungalDiseaseRiskWindow && <p><strong>Scout for disease symptoms:</strong> Warm, humid weather may favour some fungal diseases. This is not a diagnosis; ask an officer to verify symptoms.</p>}
              <ListenButton text={weather.indices.droughtRiskLevel === "HIGH" || weather.indices.droughtRiskLevel === "SEVERE"
                ? "A dry spell is expected. Check the soil and trees directly, conserve moisture with suitable mulch, and discuss water planning with an extension officer."
                : "No high drought risk is indicated in the current weather estimate. Continue checking the soil and crop directly because weather data cannot measure moisture in your field."} />
            </article>

            {latestScreening ? <article className="recommendation-full-card">
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
