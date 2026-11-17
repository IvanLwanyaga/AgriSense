import { useEffect, useState } from "react";
import { getLocalAssessmentHistory } from "../services/bctbAssessmentService";
import { getFollowUpCases } from "../services/bctbAssessmentService";
import { getActivities } from "../services/activityService";
import type { FollowUpCase } from "../types/followUp";
import type { Farm } from "../types/farm";

function isRecent(date: string, days: number): boolean {
  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp) && timestamp >= Date.now() - days * 24 * 60 * 60 * 1000;
}

export default function FarmHealthRating({ farms }: { farms: Farm[] }) {
  const [farmId, setFarmId] = useState("");
  const [cases, setCases] = useState<FollowUpCase[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    getFollowUpCases().then((items) => {
      if (active) {
        setCases(items);
        setVerificationStatus("ready");
      }
    }).catch((error: unknown) => {
      console.warn("Extension verification records are unavailable for the farm rating.", error);
      if (active) setVerificationStatus("unavailable");
    });
    return () => { active = false; };
  }, []);

  const farm = farms.find((item) => item.id === farmId) || farms[0];
  const recentScreenings = farm
    ? getLocalAssessmentHistory().filter((item) => item.farmId === farm.id && isRecent(item.createdAt, 90))
    : [];
  const farmActivities = farm
    ? getActivities(farm.id).filter((item) => isRecent(item.date, 90))
    : [];

  if (!farms.length) return null;

  const scoutPoints = Math.min(30, recentScreenings.length * 10);
  const sanitationRecords = farmActivities.filter((activity) =>
    activity.activityType === "PRUNING" || activity.activityType === "FIELD_SCOUTING"
  );
  const sanitationPoints = Math.min(40, sanitationRecords.length * 10);
  const verified = verificationStatus === "ready" && cases.some((item) =>
    item.farmId === farm?.id && item.verifiedObservation === "confirmed_bctb"
  );
  const verificationPoints = verified ? 30 : 0;
  const score = scoutPoints + sanitationPoints + verificationPoints;
  const grade = score >= 80 ? "A" : score >= 50 ? "B" : "C";

  return (
    <section className="panel farm-health-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">AgriSense Farm Health Rating</span>
          <h3>Evidence-based readiness record</h3>
        </div>
        <span className={`farm-health-grade grade-${grade.toLowerCase()}`}>{grade}</span>
      </div>
      <label className="farm-health-select">Farm
        <select value={farm?.id || ""} onChange={(event) => setFarmId(event.target.value)}>
          {farms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <p className="farm-impact-explainer">Provisional record-completeness score, not a credit score or lender-approved qualification.</p>
      <div className="farm-health-breakdown">
        <div><span>Scouting history (last 90 days)</span><strong>{scoutPoints}/30</strong><small>{recentScreenings.length} saved screening record(s) on this device</small></div>
        <div><span>Pruning / field-scouting logs (last 90 days)</span><strong>{sanitationPoints}/40</strong><small>{sanitationRecords.length} locally recorded activity item(s)</small></div>
        <div><span>Extension verification</span><strong>{verificationStatus === "loading" ? "…" : verificationStatus === "unavailable" ? "Unavailable" : verified ? "30/30" : "0/30"}</strong><small>{verificationStatus === "unavailable" ? "Verification could not be loaded" : verified ? "Confirmed visit record found" : "No confirmed extension visit found"}</small></div>
      </div>
      <div className="settings-info-card"><strong>How to improve the record</strong><p>Keep regular screenings, record pruning and field-scouring activities, and request an extension visit when appropriate. Absence of records is not proof of poor farm practice.</p></div>
      <small className="farm-impact-source">This rating is a transparent prototype based on records available to this account and device. It is not a loan, seedling, or input eligibility guarantee.</small>
    </section>
  );
}
