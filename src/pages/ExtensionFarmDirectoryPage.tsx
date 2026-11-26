import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { getDistrictFarms } from "../services/firestoreService";
import { getFollowUpCases } from "../services/bctbAssessmentService";
import type { Farm } from "../types/farm";
import type { FollowUpCase } from "../types/followUp";
import type { AppPage } from "../types/navigation";

export default function ExtensionFarmDirectoryPage({ onNavigate }: { onNavigate: (page: AppPage) => void }) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const district = profile?.assignedDistrict || "Mukono";
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cases, setCases] = useState<FollowUpCase[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getDistrictFarms(district), getFollowUpCases(district)])
      .then(([loadedFarms, loadedCases]) => {
        if (!active) return;
        setFarms(loadedFarms);
        setCases(loadedCases);
        setError("");
      })
      .catch((loadError: unknown) => {
        console.error("Could not load the officer farm directory.", loadError);
        if (active) setError(loadError instanceof Error ? loadError.message : "The district directory could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [district]);

  const caseByFarm = useMemo(() => {
    const map = new Map<string, FollowUpCase>();
    cases.forEach((item) => {
      if (!map.has(item.farmId) || (item.riskLevel === "HIGH" && item.status !== "resolved")) map.set(item.farmId, item);
    });
    return map;
  }, [cases]);
  const filtered = farms.filter((farm) => {
    const term = search.trim().toLowerCase();
    const caseFile = caseByFarm.get(farm.id);
    return !term || [farm.name, farm.district, farm.subCounty, farm.village, caseFile?.farmerName]
      .some((value) => value?.toLowerCase().includes(term));
  });
  const registeredFarmers = new Set(farms.map((farm) => farm.farmerId)).size;
  const flaggedFarms = farms.filter((farm) => {
    const item = caseByFarm.get(farm.id);
    return item && item.riskLevel !== "LOW" && item.status !== "resolved";
  }).length;

  return (
    <section className="workspace-page">
      <div className="workspace-page-header">
        <div><p className="eyebrow">{t.mapAssignedDistrict} ? {district}</p><h2>{t.farmersAndFarms}</h2><p>{t.directoryIntro}</p></div>
        <button className="outline-button" type="button" onClick={() => onNavigate("map")}>{t.viewFarmLocations}</button>
      </div>
      <div className="workspace-summary-grid">
        <article className="workspace-summary-card"><div><strong>{loading ? "—" : registeredFarmers}</strong><small>{t.farmersWithFarms}</small></div></article>
        <article className="workspace-summary-card"><div><strong>{loading ? "—" : farms.length}</strong><small>{t.registeredFarms}</small></div></article>
        <article className="workspace-summary-card"><div><strong>{loading ? "—" : flaggedFarms}</strong><small>{t.openElevatedReports}</small></div></article>
      </div>
      <label className="filter-group">{t.searchDistrictDirectory}
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.farmSearchPlaceholder} />
      </label>
      {error && <div className="form-error" role="alert">{error}<button className="text-button" type="button" onClick={() => { setFarms([]); setCases([]); setLoading(true); setError(""); void Promise.all([getDistrictFarms(district), getFollowUpCases(district)]).then(([f, c]) => { setFarms(f); setCases(c); }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Retry failed.")).finally(() => setLoading(false)); }}>{t.retry}</button></div>}
      {loading ? <div className="empty-workspace" role="status"><h3>{t.loadingDistrictFarms}</h3></div> : filtered.length ? (
        <div className="farms-layout-grid">
          {filtered.map((farm) => {
            const report = caseByFarm.get(farm.id);
            return <article className="panel" key={farm.id} style={{ padding: 18 }}>
              <div className="panel-header"><div><span className="section-kicker">{farm.subCounty || farm.district}</span><h3>{farm.name}</h3></div>{report && <span className={`risk-tag ${report.riskLevel.toLowerCase()}`}>{report.riskLevel} screening</span>}</div>
              <p><strong>{t.farmerLabel}:</strong> {report?.farmerName || t.registeredFarmer}</p>
              <p><strong>{t.locationLabel}:</strong> {[farm.village, farm.parish, farm.subCounty, farm.district].filter(Boolean).join(", ")}</p>
              <p><strong>{t.farmRecordLabel}:</strong> {farm.primaryCrop || t.cropNotRecorded}{farm.coffeeVariety ? ` · ${farm.coffeeVariety.replace(/_/g, " ")}` : ""}{farm.coffeeAcreage ? ` · ${farm.coffeeAcreage} acres coffee` : ""}</p>
              <p><strong>{t.coordinatesLabel}:</strong> {farm.location?.latitude?.toFixed(5) ?? "—"}, {farm.location?.longitude?.toFixed(5) ?? "—"}</p>
              {report ? <div className="settings-info-card"><strong>{t.latestReport}: {report.status.replace(/_/g, " ")}</strong><p>{report.triggeredFactors.join(" · ") || "No symptom factors recorded"}</p><button className="text-button" type="button" onClick={() => onNavigate("extension")}>{t.reviewReportVerification} <span aria-hidden="true">→</span></button></div> : <p className="sub-note">{t.noFollowupReport}</p>}
            </article>;
          })}
        </div>
      ) : <div className="empty-workspace"><h3>{farms.length ? "{t.noSearchMatch}" : "{t.noDistrictFarms}"}</h3><p>{t.assignedDistrictOnly}</p></div>}
    </section>
  );
}
