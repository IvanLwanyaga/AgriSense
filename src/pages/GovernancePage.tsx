import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import {
  getActiveRuleConfiguration,
  DEFAULT_RULE_CONFIG,
  getRuleConfigurations,
  saveRuleConfigurationToServer,
} from "../services/bctbRuleConfig";
import { getFollowUpCases } from "../services/bctbAssessmentService";
import { runAllRiskEngineAcceptanceTests } from "../services/bctbRiskEngine.test";
import type { RuleConfiguration } from "../types/ruleConfig";
import type { FollowUpCase } from "../types/followUp";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { updateUserAccess } from "../services/adminService";
import { UGANDA_DISTRICTS } from "../services/agronomyData";

interface AuditItem {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
}

interface OfficerAssignment {
  id: string;
  name: string;
  email: string;
  district: string;
  status: "ACTIVE" | "INACTIVE";
}

export default function GovernancePage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"STATS" | "RULES" | "OFFICERS" | "REGISTRY" | "AUDIT" | "TESTS">("STATS");
  const [testReport, setTestReport] = useState<ReturnType<typeof runAllRiskEngineAcceptanceTests> | null>(null);

  function handleRunTests() {
    const rep = runAllRiskEngineAcceptanceTests();
    setTestReport(rep);
  }

  // Rule configuration state
  const [activeRule, setActiveRule] = useState<RuleConfiguration>(getActiveRuleConfiguration());
  const [ruleList, setRuleList] = useState<RuleConfiguration[]>([DEFAULT_RULE_CONFIG]);
  const [newVersionTag, setNewVersionTag] = useState("bctb-rules-v1.1.0");
  const [newVersionName, setNewVersionName] = useState("Enhanced BCTB Rainy Season Calibration");
  const [editWeights, setEditWeights] = useState({ ...activeRule.weights });
  const [feedback, setFeedback] = useState("");
  const [savingRule, setSavingRule] = useState(false);

  // Officer assignments
  const [officers, setOfficers] = useState<OfficerAssignment[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [newAssignedDistrict, setNewAssignedDistrict] = useState("Mukono");
  const [savingOfficerAssignment, setSavingOfficerAssignment] = useState(false);
  const [officerLoadError, setOfficerLoadError] = useState("");

  // Audit trail
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);

  // Statistics calculation
  const [allCases, setAllCases] = useState<FollowUpCase[]>([]);

  useEffect(() => {
    let active = true;
    void getRuleConfigurations().then((configs) => {
      if (!active || !configs.length) return;
      setRuleList(configs);
      const selected = configs.find((config) => config.active) || configs[0];
      setActiveRule(selected);
      setEditWeights({ ...selected.weights });
    }).catch((error: unknown) => console.warn("Could not load saved rule versions.", error));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const officerUnsubscribe = onSnapshot(
      query(collection(db, "users"), where("role", "==", "AGRICULTURAL_OFFICER"), limit(200)),
      (snapshot) => {
        const loaded = snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            name: typeof data.fullName === "string" ? data.fullName : "Extension officer",
            email: typeof data.email === "string" ? data.email : "",
            district: typeof data.assignedDistrict === "string" ? data.assignedDistrict : "Unassigned",
            status: data.status === "ACTIVE" ? "ACTIVE" as const : "INACTIVE" as const,
          };
        }).sort((left, right) => left.name.localeCompare(right.name));
        setOfficers(loaded);
        setSelectedOfficerId((current) => loaded.some((item) => item.id === current) ? current : loaded[0]?.id || "");
        setOfficerLoadError("");
      },
      (error) => {
        console.error("Could not load officer assignments.", error);
        setOfficerLoadError("Officer accounts could not be loaded. Confirm platform administrator access.");
      },
    );
    const auditUnsubscribe = onSnapshot(query(collection(db, "auditLogs"), limit(100)), (snapshot) => {
      const loaded = snapshot.docs.map((item) => {
        const data = item.data();
        const timestamp = data.timestamp && typeof data.timestamp === "object" && "toDate" in data.timestamp
          ? (data.timestamp as { toDate: () => Date }).toDate().toISOString()
          : typeof data.timestamp === "string" ? data.timestamp : "";
        return {
          id: item.id,
          action: typeof data.action === "string" ? data.action : "SYSTEM_ACTION",
          performedBy: typeof data.adminEmail === "string" ? data.adminEmail : typeof data.adminId === "string" ? data.adminId : "System",
          timestamp,
          details: typeof data.details === "string" ? data.details : typeof data.ruleVersion === "string" ? `Rule configuration ${data.ruleVersion}` : typeof data.targetEmail === "string" ? `${data.role || "Account"} · ${data.status || "updated"}${data.assignedDistrict ? ` · ${data.assignedDistrict}` : ""} · ${data.targetEmail}` : "Recorded administrative action",
        };
      }).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
      setAuditLogs(loaded);
    }, (error) => console.error("Could not load live administrative audit events.", error));
    let isMounted = true;
    void getFollowUpCases("ALL")
      .then((loaded) => {
        if (isMounted) setAllCases(loaded);
      })
      .catch((err) => {
        console.error("Could not load cases for governance", err);
      });
    return () => {
      isMounted = false;
      officerUnsubscribe();
      auditUnsubscribe();
    };
  }, []);

  const highRiskTotal = allCases.filter((c) => c.riskLevel === "HIGH").length;
  const moderateRiskTotal = allCases.filter((c) => c.riskLevel === "MODERATE").length;
  const lowRiskTotal = allCases.filter((c) => c.riskLevel === "LOW").length;
  const verifiedBctbTotal = allCases.filter((c) => c.verifiedObservation === "confirmed_bctb").length;

  async function handleSaveNewRuleVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!newVersionTag.trim() || savingRule) return;
    if (activeRule.thresholds.lowMax >= activeRule.thresholds.moderateMax) {
      setFeedback("Low-risk maximum must be lower than the moderate-risk maximum.");
      return;
    }
    if (Object.values(editWeights).some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
      setFeedback("Rule weights must be between 0 and 100.");
      return;
    }
    const newConfig: RuleConfiguration = {
      id: newVersionTag.trim(),
      version: newVersionTag.trim(),
      name: newVersionName.trim() || newVersionTag.trim(),
      description: "Externalized expert-rule weights for BCTB Robusta screening.",
      active: true,
      validationStatus: "pending_validation_by_coffee_agronomist",
      weights: { ...editWeights },
      thresholds: { ...activeRule.thresholds },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: profile?.email || "Platform administrator",
    };
    setSavingRule(true);
    setFeedback("");
    try {
      await saveRuleConfigurationToServer(newConfig);
      setRuleList([newConfig, ...ruleList.map((item) => ({ ...item, active: false }))]);
      setActiveRule(newConfig);
      setFeedback(`Rule configuration "${newConfig.version}" created and activated.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Rule configuration could not be saved.");
    } finally {
      setSavingRule(false);
    }
  }

  async function handleActivateVersion(config: RuleConfiguration) {
    const target = { ...config, active: true };
    setSavingRule(true);
    setFeedback("");
    try {
      await saveRuleConfigurationToServer(target);
      setRuleList(ruleList.map((item) => ({ ...item, active: item.id === target.id })));
      setActiveRule(target);
      setEditWeights({ ...target.weights });
      setFeedback(`Switched active rule engine to ${config.version}.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Rule version could not be activated.");
    } finally {
      setSavingRule(false);
    }
  }

  async function handleReassignOfficer(e: React.FormEvent) {
    e.preventDefault();
    const targetOff = officers.find((o) => o.id === selectedOfficerId);
    if (!targetOff || !newAssignedDistrict.trim() || savingOfficerAssignment) return;
    setSavingOfficerAssignment(true);
    setFeedback("");
    try {
      await updateUserAccess(targetOff.email, "AGRICULTURAL_OFFICER", targetOff.status, newAssignedDistrict.trim());
      setFeedback(`Officer assigned to ${newAssignedDistrict} District.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Officer assignment could not be saved.");
    } finally {
      setSavingOfficerAssignment(false);
    }
  }

  function handleExportAggregateReport() {
    const districtCases = new Map<string, FollowUpCase[]>();
    allCases.forEach((item) => districtCases.set(item.district, [...(districtCases.get(item.district) || []), item]));
    const reportData = {
      exportTimestamp: new Date().toISOString(),
      governanceScope: "Uganda Robusta Coffee BCTB Pilot",
      activeEngineVersion: activeRule.version,
      summaryStats: {
        totalScreenedCases: allCases.length,
        highRiskCases: highRiskTotal,
        moderateRiskCases: moderateRiskTotal,
        lowRiskCases: lowRiskTotal,
        empiricallyVerifiedBctb: verifiedBctbTotal,
      },
      anonymizedDistrictAggregates: [...districtCases.entries()].map(([district, cases]) => ({
        district,
        totalCases: cases.length,
        highRiskRate: `${Math.round((cases.filter((item) => item.riskLevel === "HIGH").length / cases.length) * 100)}%`,
        confirmedRate: `${Math.round((cases.filter((item) => item.verifiedObservation === "confirmed_bctb").length / cases.length) * 100)}%`,
      })),
      academicDisclaimer:
        "Screening supports extension follow-up and is not a diagnosis or pesticide prescription.",
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agrisense_bctb_aggregate_report_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="workspace-page governance-page">
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">{t.governanceEyebrow}</p>
          <h2>{t.governanceTitle}</h2>
          <p>{t.governanceIntro}</p>
        </div>

        <button className="outline-button" type="button" onClick={handleExportAggregateReport}>{t.exportAggregate}</button>
      </div>

      {/* Navigation Tabs */}
      <div className="xai-tab-nav" role="tablist">
        <button
          className={`xai-tab ${activeTab === "STATS" ? "active" : ""}`}
          onClick={() => setActiveTab("STATS")}
          type="button"
        >
          📊 {t.systemStatistics}
        </button>
        <button
          className={`xai-tab ${activeTab === "RULES" ? "active" : ""}`}
          onClick={() => setActiveTab("RULES")}
          type="button"
        >
          ⚙️ {t.ruleConfiguration} ({ruleList.length})
        </button>
        <button
          className={`xai-tab ${activeTab === "OFFICERS" ? "active" : ""}`}
          onClick={() => setActiveTab("OFFICERS")}
          type="button"
        >
          👮 {t.officerAreas} ({officers.length})
        </button>
        <button
          className={`xai-tab ${activeTab === "REGISTRY" ? "active" : ""}`}
          onClick={() => setActiveTab("REGISTRY")}
          type="button"
        >
          🤖 {t.modelGovernance}
        </button>
        <button
          className={`xai-tab ${activeTab === "AUDIT" ? "active" : ""}`}
          onClick={() => setActiveTab("AUDIT")}
          type="button"
        >
          📜 {t.auditLedger} ({auditLogs.length})
        </button>
        <button
          className={`xai-tab ${activeTab === "TESTS" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("TESTS");
            if (!testReport) handleRunTests();
          }}
          type="button"
        >
          🧪 {t.riskEngineTests}
        </button>
      </div>

      {/* Tab 1: System Statistics */}
      {activeTab === "STATS" && (
        <div className="tab-content">
          <div className="kpi-grid">
            <div className="panel kpi-card">
              <span className="section-kicker">Total Assessments</span>
              <h3>{allCases.length}</h3>
              <p>Piloted Robusta coffee screenings</p>
            </div>
            <div className="panel kpi-card">
              <span className="section-kicker">High-Risk Alerts</span>
              <h3 className="warning-text">{highRiskTotal}</h3>
              <p>{allCases.length > 0 ? Math.round((highRiskTotal / allCases.length) * 100) : 0}% of all assessments</p>
            </div>
            <div className="panel kpi-card">
              <span className="section-kicker">Field Confirmations</span>
              <h3 className="success-text">{verifiedBctbTotal}</h3>
              <p>Confirmed BCTB by extension officers</p>
            </div>
            <div className="panel kpi-card">
              <span className="section-kicker">Active Rule Base</span>
              <h3 className="primary-text">{activeRule.version}</h3>
              <p>Validation: Pending Agronomist</p>
            </div>
          </div>

          <div className="panel chart-summary-panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker">Risk Distribution Breakdown</span>
                <h3>Pilot Administrative Area Overview</h3>
              </div>
            </div>
            <div className="risk-bar-container">
              <div
                className="risk-bar-segment high"
                style={{ width: `${(highRiskTotal / (allCases.length || 1)) * 100}%` }}
                title={`High: ${highRiskTotal}`}
              >
                High ({highRiskTotal})
              </div>
              <div
                className="risk-bar-segment moderate"
                style={{ width: `${(moderateRiskTotal / (allCases.length || 1)) * 100}%` }}
                title={`Moderate: ${moderateRiskTotal}`}
              >
                Moderate ({moderateRiskTotal})
              </div>
              <div
                className="risk-bar-segment low"
                style={{ width: `${(lowRiskTotal / (allCases.length || 1)) * 100}%` }}
                title={`Low: ${lowRiskTotal}`}
              >
                Low ({lowRiskTotal})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rule Configuration Manager */}
      {activeTab === "RULES" && (
        <div className="tab-content">
          {feedback && <div className="success-banner">{feedback}</div>}

          <div className="panel rule-versions-panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker">Version Control</span>
                <h3>Preserved Rule Configuration Versions</h3>
              </div>
            </div>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Name</th>
                  <th>Created</th>
                  <th>Validation Status</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {ruleList.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.version}</strong></td>
                    <td>{r.name}</td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="telemetry-badge simulated">
                        <span className="dot amber" /> {r.validationStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <span className={`prod-pill ${r.active ? "active" : ""}`}>
                        {r.active ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td>
                      {!r.active ? (
                        <button
                          className="outline-button-sm"
                          type="button"
                          disabled={savingRule}
                          onClick={() => handleActivateVersion(r)}
                        >
                          Activate
                        </button>
                      ) : (
                        <span className="active-label">Currently Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form className="panel rule-editor-form" onSubmit={handleSaveNewRuleVersion}>
            <div className="panel-header">
              <div>
                <span className="section-kicker">Authoring & Calibration</span>
                <h3>Create New Rule Version (Preserves Previous Version)</h3>
              </div>
            </div>

            <div className="form-row">
              <label>
                New Version Identifier:
                <input
                  type="text"
                  value={newVersionTag}
                  onChange={(e) => setNewVersionTag(e.target.value)}
                  placeholder="e.g. bctb-rules-v1.1.0"
                  required
                />
              </label>

              <label>
                Configuration Name:
                <input
                  type="text"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  placeholder="e.g. Dry Season Weighting Calibration"
                  required
                />
              </label>
            </div>

            <h4>Calibrate Feature Rule Weights (Points towards 0–100 risk score):</h4>
            <div className="weights-grid">
              <label>
                Pin-Sized Holes on Underside (Primary Sign):
                <input
                  type="number"
                  value={editWeights.pinSizedHoles}
                  onChange={(e) =>
                    setEditWeights({ ...editWeights, pinSizedHoles: Number(e.target.value) })
                  }
                />
              </label>

              <label>
                Increasing Twig Damage:
                <input
                  type="number"
                  value={editWeights.increasingDamage}
                  onChange={(e) =>
                    setEditWeights({ ...editWeights, increasingDamage: Number(e.target.value) })
                  }
                />
              </label>

              <label>
                Twig Wilting / Drying:
                <input type="number" min="0" max="100" value={editWeights.twigWiltingDrying} onChange={(e) => setEditWeights({ ...editWeights, twigWiltingDrying: Number(e.target.value) })} />
              </label>

              <label>
                Previous BCTB History:
                <input
                  type="number"
                  value={editWeights.previousBctbHistory}
                  onChange={(e) =>
                    setEditWeights({ ...editWeights, previousBctbHistory: Number(e.target.value) })
                  }
                />
              </label>

              <label>
                Twig Blackening / Ambrosia Fungus:
                <input
                  type="number"
                  value={editWeights.twigBlackening}
                  onChange={(e) =>
                    setEditWeights({ ...editWeights, twigBlackening: Number(e.target.value) })
                  }
                />
              </label>

              <label>
                Leaf Yellowing:
                <input type="number" min="0" max="100" value={editWeights.leafYellowing} onChange={(e) => setEditWeights({ ...editWeights, leafYellowing: Number(e.target.value) })} />
              </label>

              <label>
                Points per Affected Twig:
                <input type="number" min="0" max="100" value={editWeights.affectedTwigCountFactor} onChange={(e) => setEditWeights({ ...editWeights, affectedTwigCountFactor: Number(e.target.value) })} />
              </label>

              <label>
                Maximum Twig Count Score:
                <input type="number" min="0" max="100" value={editWeights.maxTwigCountScore} onChange={(e) => setEditWeights({ ...editWeights, maxTwigCountScore: Number(e.target.value) })} />
              </label>

              <label>
                Poor Farm Sanitation:
                <input type="number" min="0" max="100" value={editWeights.poorSanitation} onChange={(e) => setEditWeights({ ...editWeights, poorSanitation: Number(e.target.value) })} />
              </label>

              <label>
                Inconsistent Twig Removal:
                <input type="number" min="0" max="100" value={editWeights.inconsistentTwigRemoval} onChange={(e) => setEditWeights({ ...editWeights, inconsistentTwigRemoval: Number(e.target.value) })} />
              </label>

              <label>
                Dense Shade:
                <input type="number" min="0" max="100" value={editWeights.denseShade} onChange={(e) => setEditWeights({ ...editWeights, denseShade: Number(e.target.value) })} />
              </label>

              <label>
                Consecutive Dry-Spell Days (&ge; 14 days):
                <input
                  type="number"
                  value={editWeights.weatherDrySpellDays}
                  onChange={(e) =>
                    setEditWeights({ ...editWeights, weatherDrySpellDays: Number(e.target.value) })
                  }
                />
              </label>

              <label>
                30-Day Rainfall Deficit (&lt;50mm):
                <input
                  type="number"
                  value={editWeights.weatherRainDeficit}
                  onChange={(e) =>
                    setEditWeights({ ...editWeights, weatherRainDeficit: Number(e.target.value) })
                  }
                />
              </label>
            </div>

            <h4>Risk Classification Thresholds:</h4>
            <div className="form-row">
              <label>Maximum Low-Risk Score
                <input type="number" min="0" max="98" value={activeRule.thresholds.lowMax} onChange={(e) => setActiveRule({ ...activeRule, thresholds: { ...activeRule.thresholds, lowMax: Number(e.target.value) } })} />
              </label>
              <label>Maximum Moderate-Risk Score
                <input type="number" min="1" max="99" value={activeRule.thresholds.moderateMax} onChange={(e) => setActiveRule({ ...activeRule, thresholds: { ...activeRule.thresholds, moderateMax: Number(e.target.value) } })} />
              </label>
            </div>

            <button className="primary-button" type="submit" disabled={savingRule}>
              {savingRule ? "Saving rule version…" : "Save & Activate New Rule Version"}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Officer Assignments */}
      {activeTab === "OFFICERS" && (
        <div className="tab-content">
          {feedback && <div className="success-banner">{feedback}</div>}

          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker">Administrative Isolation</span>
                <h3>Extension Officer District Assignments</h3>
              </div>
            </div>
            {officerLoadError && <p className="form-error" role="alert">{officerLoadError}</p>}
            {!officers.length && !officerLoadError && <p className="sub-note">No extension officer accounts are registered yet.</p>}

            <table className="history-table">
              <thead>
                <tr>
                  <th>Officer Name</th>
                  <th>Email</th>
                  <th>Assigned District</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.name}</strong></td>
                    <td>{o.email}</td>
                    <td>📍 {o.district} District</td>
                    <td><span className="status-pill">{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <form className="officer-reassign-form" onSubmit={handleReassignOfficer}>
              <h4>Reassign Officer Administrative Boundary</h4>
              <div className="form-row">
                <label>
                  Select Officer:
                  <select
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    disabled={!officers.length || savingOfficerAssignment}
                  >
                    {officers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.district})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  New District:
                  <select
                    value={newAssignedDistrict}
                    onChange={(e) => setNewAssignedDistrict(e.target.value)}
                    disabled={savingOfficerAssignment}
                  >
                    {UGANDA_DISTRICTS.map((district) => <option key={district.name} value={district.name}>{district.name} District</option>)}
                  </select>
                </label>
              </div>

              <button className="primary-button" type="submit" disabled={savingOfficerAssignment || !selectedOfficerId}>
                {savingOfficerAssignment ? "Saving assignment…" : "Update Officer Assignment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Model Registry (Research / Inactive) */}
      {activeTab === "REGISTRY" && (
        <div className="tab-content">
          <div className="panel model-registry-warning">
            <div className="academic-notice-banner">
              <strong>Academic & Engineering Transparency:</strong>
              <p>
                In strict accordance with scientific integrity and the project specifications, the Machine Learning (ML) module is currently <strong>INACTIVE in production</strong>.
                Decision-support risk screening is performed deterministically by versioned expert rules (<strong>{activeRule.version}</strong>).
                ML models will only be activated after an empirical, agronomist-verified Robusta coffee field dataset (N &gt; 1,000 observations) is collected and validated with NARO/CODA.
              </p>
            </div>

            <div className="models-registry-grid">
              <div className="panel model-card inactive">
                <div className="model-card-header">
                  <div>
                    <span className="section-kicker">Research Pipeline (Inactive)</span>
                    <h3>XGBoost BCTB Risk Classifier</h3>
                    <small className="model-id-code">xgb-bctb-robusta-v0.1-research</small>
                  </div>
                  <span className="prod-pill inactive">INACTIVE (Research Only)</span>
                </div>
                <div className="model-details">
                  <p>
                    Supervised gradient-boosted decision tree pipeline designed for multi-factor infestation prediction. Deployed in sandbox mode only; does not generate production screening scores.
                  </p>
                  <div className="model-meta-table">
                    <div>
                      <small>Architecture</small>
                      <strong>XGBoost / Random Forest</strong>
                    </div>
                    <div>
                      <small>Training Dataset</small>
                      <span>bctb_synthetic_demo.csv (DEMO_ONLY)</span>
                    </div>
                    <div>
                      <small>Production Status</small>
                      <strong className="warning-text">LOCKED / INACTIVE</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Immutable Audit Ledger */}
      {activeTab === "AUDIT" && (
        <div className="tab-content">
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker">Security & Compliance</span>
                <h3>Immutable System Audit Ledger</h3>
              </div>
            </div>

            <table className="history-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Author</th>
                  <th>Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><code>{log.action}</code></td>
                    <td>{log.performedBy}</td>
                    <td><small>{log.details}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Live Acceptance Test Suite (Section 25.4) */}
      {activeTab === "TESTS" && (
        <div className="tab-content">
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker">Deterministic Risk Engine Verification</span>
                <h3>Automated Risk Engine {t.riskEngineTests}</h3>
                <p>
                  Evaluates the deterministic BCTB Expert Rules engine against all 10 required acceptance scenarios defined in Section 25.4.
                </p>
              </div>

              <button className="primary-button" type="button" onClick={handleRunTests}>
                ▶ Re-run All 10 Tests Live
              </button>
            </div>

            {testReport && (
              <div className="test-summary-strip">
                <span className={`status-pill ${testReport.allPassed ? "active" : ""}`}>
                  {testReport.allPassed ? "✓ 10/10 SCENARIOS PASSED" : "FAILED"}
                </span>
                <span>
                  Passed <strong>{testReport.passedTests}</strong> of <strong>{testReport.totalTests}</strong> test cases with 100% deterministic reproducibility.
                </span>
              </div>
            )}

            <div className="history-table-wrap" style={{ marginTop: 16 }}>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Acceptance Scenario Name</th>
                    <th>Risk Score</th>
                    <th>Risk Level</th>
                    <th>Data Quality</th>
                    <th>Weather Linked</th>
                    <th>Verification Result</th>
                    <th>Diagnostic Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {testReport?.results.map((r) => (
                    <tr key={r.scenarioNumber}>
                      <td><strong>{r.scenarioNumber}</strong></td>
                      <td><strong>{r.scenarioName}</strong></td>
                      <td>{r.score}/100</td>
                      <td>
                        <span className={`risk-tag ${r.riskLevel.toLowerCase()}`}>
                          {r.riskLevel}
                        </span>
                      </td>
                      <td><code>{r.dataQuality}</code></td>
                      <td>{r.weatherAvailable ? "✓ Yes" : "✕ Safe Null"}</td>
                      <td>
                        <span style={{ color: r.passed ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                          {r.passed ? "✓ PASS" : "✕ FAIL"}
                        </span>
                      </td>
                      <td><small>{r.notes}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
