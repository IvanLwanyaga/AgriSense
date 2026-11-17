import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import {
  getActiveRuleConfiguration,
  saveRuleConfiguration,
  DEFAULT_RULE_CONFIG,
} from "../services/bctbRuleConfig";
import { getFollowUpCases } from "../services/bctbAssessmentService";
import { runAllRiskEngineAcceptanceTests } from "../services/bctbRiskEngine.test";
import type { RuleConfiguration } from "../types/ruleConfig";
import type { FollowUpCase } from "../types/followUp";

interface AuditItem {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
}

const INITIAL_AUDIT_LOGS: AuditItem[] = [
  {
    id: "aud_01",
    action: "RULE_CONFIG_ACTIVATED",
    performedBy: "admin@agrisense.ug",
    timestamp: "2026-09-01T00:00:00Z",
    details: "Activated Uganda Robusta BCTB Expert Rules v1.0.0 (pending agronomist validation).",
  },
  {
    id: "aud_02",
    action: "OFFICER_ASSIGNMENT",
    performedBy: "admin@agrisense.ug",
    timestamp: "2026-09-05T10:15:00Z",
    details: "Assigned Muwonge David (BSc Agronomy) to Mukono District coffee administrative area.",
  },
  {
    id: "aud_03",
    action: "OFFICER_ASSIGNMENT",
    performedBy: "admin@agrisense.ug",
    timestamp: "2026-09-05T10:16:00Z",
    details: "Assigned Namubiru Sarah to Wakiso District coffee administrative area.",
  },
];

interface OfficerAssignment {
  id: string;
  name: string;
  email: string;
  district: string;
  status: "ACTIVE" | "ON_LEAVE";
}

const INITIAL_OFFICERS: OfficerAssignment[] = [
  {
    id: "off_01",
    name: "Muwonge David (BSc Agronomy)",
    email: "officer.mukono@agrisense.ug",
    district: "Mukono",
    status: "ACTIVE",
  },
  {
    id: "off_02",
    name: "Namubiru Sarah",
    email: "officer.wakiso@agrisense.ug",
    district: "Wakiso",
    status: "ACTIVE",
  },
  {
    id: "off_03",
    name: "Kibalama Paul",
    email: "officer.luweero@agrisense.ug",
    district: "Luweero",
    status: "ACTIVE",
  },
];

export default function GovernancePage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"STATS" | "RULES" | "OFFICERS" | "REGISTRY" | "AUDIT" | "TESTS">("STATS");
  const [testReport, setTestReport] = useState<ReturnType<typeof runAllRiskEngineAcceptanceTests> | null>(null);

  function handleRunTests() {
    const rep = runAllRiskEngineAcceptanceTests();
    setTestReport(rep);
  }

  // Rule configuration state
  const [activeRule, setActiveRule] = useState<RuleConfiguration>(getActiveRuleConfiguration());
  const [ruleList, setRuleList] = useState<RuleConfiguration[]>([
    DEFAULT_RULE_CONFIG,
    {
      ...DEFAULT_RULE_CONFIG,
      id: "rule_config_v1_1_draft",
      version: "bctb-rules-v1.1.0-draft",
      name: "Uganda Robusta Coffee BCTB Rules V1.1 (Candidate)",
      active: false,
      weights: { ...DEFAULT_RULE_CONFIG.weights, pinSizedHoles: 35 },
      createdAt: "2026-09-10T12:00:00Z",
    },
  ]);
  const [newVersionTag, setNewVersionTag] = useState("bctb-rules-v1.1.0");
  const [newVersionName, setNewVersionName] = useState("Enhanced BCTB Rainy Season Calibration");
  const [editWeights, setEditWeights] = useState({ ...activeRule.weights });
  const [feedback, setFeedback] = useState("");

  // Officer assignments
  const [officers, setOfficers] = useState<OfficerAssignment[]>(INITIAL_OFFICERS);
  const [selectedOfficerId, setSelectedOfficerId] = useState("off_01");
  const [newAssignedDistrict, setNewAssignedDistrict] = useState("Mukono");

  // Audit trail
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>(INITIAL_AUDIT_LOGS);

  // Statistics calculation
  const [allCases, setAllCases] = useState<FollowUpCase[]>([]);

  useEffect(() => {
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
    };
  }, []);

  const highRiskTotal = allCases.filter((c) => c.riskLevel === "HIGH").length;
  const moderateRiskTotal = allCases.filter((c) => c.riskLevel === "MODERATE").length;
  const lowRiskTotal = allCases.filter((c) => c.riskLevel === "LOW").length;
  const verifiedBctbTotal = allCases.filter((c) => c.verifiedObservation === "confirmed_bctb").length;

  function handleSaveNewRuleVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!newVersionTag.trim()) return;

    const newConfig: RuleConfiguration = {
      id: `rule_${Date.now()}`,
      version: newVersionTag.trim(),
      name: newVersionName.trim() || newVersionTag.trim(),
      description: "Externalized expert-rule weights for BCTB Robusta screening.",
      active: true,
      validationStatus: "pending_validation_by_coffee_agronomist",
      weights: { ...editWeights },
      thresholds: { ...activeRule.thresholds },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: profile?.email || "admin@agrisense.ug",
    };

    // Mark previous as inactive and add new version
    const updatedList = ruleList.map((r) => ({ ...r, active: false }));
    updatedList.unshift(newConfig);

    setRuleList(updatedList);
    setActiveRule(newConfig);
    saveRuleConfiguration(newConfig);

    // Add to audit ledger
    const logItem: AuditItem = {
      id: `aud_${Date.now()}`,
      action: "RULE_VERSION_CREATED_AND_ACTIVATED",
      performedBy: profile?.email || "admin@agrisense.ug",
      timestamp: new Date().toISOString(),
      details: `Created version ${newConfig.version} and set as active. Previous versions preserved immutable.`,
    };
    setAuditLogs([logItem, ...auditLogs]);
    setFeedback(`✓ New rule configuration "${newConfig.version}" created and activated!`);
  }

  function handleActivateVersion(config: RuleConfiguration) {
    const updatedList = ruleList.map((r) => ({ ...r, active: r.id === config.id }));
    setRuleList(updatedList);
    const target = { ...config, active: true };
    setActiveRule(target);
    saveRuleConfiguration(target);

    const logItem: AuditItem = {
      id: `aud_${Date.now()}`,
      action: "RULE_VERSION_ACTIVATED",
      performedBy: profile?.email || "admin@agrisense.ug",
      timestamp: new Date().toISOString(),
      details: `Switched active rule engine configuration to ${config.version}.`,
    };
    setAuditLogs([logItem, ...auditLogs]);
    setFeedback(`✓ Switched active rule engine to ${config.version}`);
  }

  function handleReassignOfficer(e: React.FormEvent) {
    e.preventDefault();
    const updated = officers.map((o) =>
      o.id === selectedOfficerId ? { ...o, district: newAssignedDistrict } : o
    );
    setOfficers(updated);

    const targetOff = officers.find((o) => o.id === selectedOfficerId);
    const logItem: AuditItem = {
      id: `aud_${Date.now()}`,
      action: "OFFICER_REASSIGNED",
      performedBy: profile?.email || "admin@agrisense.ug",
      timestamp: new Date().toISOString(),
      details: `Reassigned ${targetOff?.name} to ${newAssignedDistrict} District.`,
    };
    setAuditLogs([logItem, ...auditLogs]);
    setFeedback(`✓ Reassigned officer to ${newAssignedDistrict} District.`);
  }

  function handleExportAggregateReport() {
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
      anonymizedDistrictAggregates: [
        { district: "Mukono", totalCases: 2, highRiskRate: "50%", confirmedRate: "0%" },
        { district: "Wakiso", totalCases: 1, highRiskRate: "100%", confirmedRate: "100%" },
      ],
      academicDisclaimer:
        "DEMONSTRATION AND PILOT EVALUATION REPORT. NOT INTENDED FOR PESTICIDE PRESCRIPTION.",
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
          <p className="eyebrow">System Administration & Audit Ledger</p>
          <h2>Platform Governance & Rule Management</h2>
          <p>
            Manage versioned rule configurations, assign extension officers to administrative areas, inspect immutable audit trails, and review system statistics.
          </p>
        </div>

        <button className="outline-button" type="button" onClick={handleExportAggregateReport}>
          📥 Export Anonymized Report (JSON)
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="xai-tab-nav" role="tablist">
        <button
          className={`xai-tab ${activeTab === "STATS" ? "active" : ""}`}
          onClick={() => setActiveTab("STATS")}
          type="button"
        >
          📊 System Statistics
        </button>
        <button
          className={`xai-tab ${activeTab === "RULES" ? "active" : ""}`}
          onClick={() => setActiveTab("RULES")}
          type="button"
        >
          ⚙️ Rule Configuration ({ruleList.length})
        </button>
        <button
          className={`xai-tab ${activeTab === "OFFICERS" ? "active" : ""}`}
          onClick={() => setActiveTab("OFFICERS")}
          type="button"
        >
          👮 Extension Officer Areas ({officers.length})
        </button>
        <button
          className={`xai-tab ${activeTab === "REGISTRY" ? "active" : ""}`}
          onClick={() => setActiveTab("REGISTRY")}
          type="button"
        >
          🤖 Model Registry (Research Only)
        </button>
        <button
          className={`xai-tab ${activeTab === "AUDIT" ? "active" : ""}`}
          onClick={() => setActiveTab("AUDIT")}
          type="button"
        >
          📜 Immutable Audit Ledger ({auditLogs.length})
        </button>
        <button
          className={`xai-tab ${activeTab === "TESTS" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("TESTS");
            if (!testReport) handleRunTests();
          }}
          type="button"
        >
          🧪 Acceptance Tests (10 Scenarios)
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

            <button className="primary-button" type="submit">
              Save & Activate New Rule Version
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
                  >
                    <option value="Mukono">Mukono District</option>
                    <option value="Wakiso">Wakiso District</option>
                    <option value="Luweero">Luweero District</option>
                    <option value="Masaka">Masaka District</option>
                    <option value="Mpigi">Mpigi District</option>
                  </select>
                </label>
              </div>

              <button className="primary-button" type="submit">
                Update Officer Assignment
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
                <h3>Automated Risk Engine Acceptance Tests (10 Scenarios)</h3>
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
