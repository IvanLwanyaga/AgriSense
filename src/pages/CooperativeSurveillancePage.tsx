import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/useAuth";
import { getFarms, getOrganizationScreenings } from "../services/firestoreService";
import { authenticatedFetch } from "../services/authenticatedFetch";
import type { Farm } from "../types/farm";
import type { BctbRiskResult } from "../types/bctb";

type BroadcastResult = { sent: number; queued: number; failed: number; skipped: number; costUgx: number };

export default function CooperativeSurveillancePage() {
  const { user, profile } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [screenings, setScreenings] = useState<BctbRiskResult[]>([]);
  const [selectedSubCounty, setSelectedSubCounty] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [message, setMessage] = useState("Coffee field advisory: please scout your coffee trees for twig dieback and pin-sized holes. Prune affected twigs and collect them safely for destruction.");
  const [sending, setSending] = useState(false);
  const [broadcastError, setBroadcastError] = useState("");
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.uid || !profile?.organizationId) {
        setLoadError("A cooperative organization must be linked to this account.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError("");
      try {
        const [registeredFarms, results] = await Promise.all([
          getFarms(user.uid, profile.organizationId),
          getOrganizationScreenings(profile.organizationId),
        ]);
        if (active) {
          setFarms(registeredFarms);
          setScreenings(results);
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Cooperative data could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [user?.uid, profile?.organizationId]);

  const subCounties = useMemo(
    () => [...new Set(farms.map((farm) => farm.subCounty).filter((value): value is string => Boolean(value)))].sort(),
    [farms]
  );
  const visibleFarms = selectedSubCounty === "ALL"
    ? farms
    : farms.filter((farm) => farm.subCounty === selectedSubCounty);
  const visibleFarmIds = new Set(visibleFarms.map((farm) => farm.id));
  const visibleScreenings = screenings.filter((result) => Boolean(result.farmId && visibleFarmIds.has(result.farmId)));
  const latestByFarm = new Map<string, BctbRiskResult>();
  for (const result of visibleScreenings) {
    if (result.farmId && !latestByFarm.has(result.farmId)) latestByFarm.set(result.farmId, result);
  }
  const moderateToHigh = [...latestByFarm.values()].filter((result) => result.riskLevel === "HIGH" || result.riskLevel === "MODERATE");
  const affectedFarmIds = new Set(moderateToHigh.map((result) => result.farmId));
  const affectedGrowers = new Set(visibleFarms.filter((farm) => affectedFarmIds.has(farm.id)).map((farm) => farm.farmerId));
  const subCountyRisk = subCounties.map((subCounty) => {
    const subCountyFarms = farms.filter((farm) => farm.subCounty === subCounty);
    const farmIds = new Set(subCountyFarms.map((farm) => farm.id));
    const latest = new Map<string, BctbRiskResult>();
    for (const result of screenings) {
      if (result.farmId && farmIds.has(result.farmId) && !latest.has(result.farmId)) latest.set(result.farmId, result);
    }
    return {
      subCounty,
      farms: subCountyFarms.length,
      screened: latest.size,
      atRisk: [...latest.values()].filter((result) => result.riskLevel !== "LOW").length,
    };
  });

  async function sendBroadcast() {
    const farmerIds = [...affectedGrowers].slice(0, 100);
    if (!farmerIds.length || !message.trim()) return;
    setSending(true);
    setBroadcastError("");
    setBroadcastResult(null);
    try {
      const response = await authenticatedFetch("/api/sendSmsBroadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmerIds, message: message.trim() }),
      });
      const payload = await response.json().catch(() => ({})) as {
        sent?: number;
        queued?: number;
        failed?: number;
        skipped?: number;
        costUgx?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || `Broadcast failed (HTTP ${response.status}).`);
      setBroadcastResult({
        sent: payload.sent || 0,
        queued: payload.queued || 0,
        failed: payload.failed || 0,
        skipped: payload.skipped || 0,
        costUgx: payload.costUgx || 0,
      });
      setShowBroadcast(false);
    } catch (error) {
      setBroadcastError(error instanceof Error ? error.message : "The broadcast could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="workspace-page cooperative-surveillance-page">
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">Organization field intelligence</p>
          <h2>Cooperative Surveillance</h2>
          <p>Latest BCTB screening snapshot for farms registered to this organization.</p>
        </div>
        <label className="filter-group">Sub-county
          <select value={selectedSubCounty} onChange={(event) => setSelectedSubCounty(event.target.value)}>
            <option value="ALL">All sub-counties</option>
            {subCounties.map((subCounty) => <option key={subCounty} value={subCounty}>{subCounty}</option>)}
          </select>
        </label>
      </div>

      {loading ? <div className="empty-workspace">Loading cooperative surveillance…</div> : loadError ? (
        <div className="form-error" role="alert">{loadError}</div>
      ) : (
        <>
          <div className="settings-info-card"><strong>Coverage note:</strong> Counts include cloud-synced BCTB screenings recorded for this cooperative. Unscreened growers and farms without mapped sub-counties are not represented as risk-free.</div>
          <div className="workspace-summary-grid">
            <article className="workspace-summary-card"><div><strong>{visibleFarms.length}</strong><small>registered farms in view</small></div></article>
            <article className="workspace-summary-card"><div><strong>{latestByFarm.size}</strong><small>farms with a screening result</small></div></article>
            <article className="workspace-summary-card"><div><strong>{affectedGrowers.size}</strong><small>growers with latest moderate/high result</small></div></article>
            <article className="workspace-summary-card"><div><strong>Not available</strong><small>yield-at-risk needs verified per-farm yield records</small></div></article>
          </div>

          <div className="panel cooperative-risk-panel">
            <div className="panel-header"><div><span className="section-kicker">Sub-county screening coverage</span><h3>Risk overview</h3></div></div>
            {subCountyRisk.length ? (
              <div className="cooperative-risk-list">
                {subCountyRisk.map((item) => (
                  <article key={item.subCounty}>
                    <strong>{item.subCounty}</strong>
                    <span>{item.farms} registered farms</span>
                    <span>{item.screened} screened</span>
                    <b>{item.atRisk} latest moderate/high</b>
                    <div className="cooperative-risk-track"><span style={{ width: `${item.screened ? Math.min(100, item.atRisk / item.screened * 100) : 0}%` }} /></div>
                  </article>
                ))}
              </div>
            ) : <p>No sub-county assignment is recorded on the cooperative farms yet.</p>}
          </div>

          <div className="panel cooperative-farm-table">
            <div className="panel-header"><div><span className="section-kicker">Outgrower follow-up list</span><h3>Most recent screenings</h3></div></div>
            {moderateToHigh.length ? moderateToHigh.map((result) => {
              const farm = farms.find((item) => item.id === result.farmId);
              return (
                <article key={result.id || `${result.farmId}-${result.createdAt}`}>
                  <strong>{farm?.name || "Farm"}</strong>
                  <span>{farm?.subCounty || "Sub-county not recorded"}</span>
                  <span>{result.riskLevel} · {new Date(result.createdAt).toLocaleDateString()}</span>
                </article>
              );
            }) : <p>No moderate or high screening result is recorded in this view.</p>}
          </div>

          <div className="cooperative-broadcast-actions">
            {affectedGrowers.size > 0 && (
              <button className="primary-button" type="button" onClick={() => { setBroadcastError(""); setShowBroadcast(true); }}>
                Prepare SMS to up to {Math.min(100, affectedGrowers.size)} growers
              </button>
            )}
            {broadcastResult && <p role="status">Broadcast complete: {broadcastResult.sent} sent, {broadcastResult.queued} queued, {broadcastResult.failed} failed, {broadcastResult.skipped} skipped; recorded cost {broadcastResult.costUgx} UGX.</p>}
            {broadcastError && <p className="form-error" role="alert">{broadcastError}</p>}
          </div>

          {showBroadcast && (
            <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowBroadcast(false); }}>
              <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="cooperative-broadcast-title">
                <header className="modal-header">
                  <h2 id="cooperative-broadcast-title">Review batch advisory</h2>
                  <p className="modal-subtitle">Only active cooperative farmers with explicit SMS opt-in and a valid phone number will receive a message. Limit: 100 growers per dispatch.</p>
                </header>
                <label>SMS message ({message.length}/160)
                  <textarea rows={4} maxLength={160} value={message} onChange={(event) => setMessage(event.target.value)} />
                </label>
                <p className="settings-info-card">Recipients identified by screening: {Math.min(100, affectedGrowers.size)}. At most 50 UGX per delivered SMS when the gateway is configured.</p>
                <div className="form-actions">
                  <button className="select-button" type="button" onClick={() => setShowBroadcast(false)}>Cancel</button>
                  <button className="primary-button" type="button" onClick={() => void sendBroadcast()} disabled={sending || !message.trim()}>
                    {sending ? "Dispatching…" : "Confirm and dispatch"}
                  </button>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </section>
  );
}
