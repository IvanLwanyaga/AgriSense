import { useState, useEffect } from "react";
import { getBlob, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase/config";
import { useAuth } from "../context/useAuth";
import { getFollowUpCases, updateCaseStatus } from "../services/bctbAssessmentService";
import type { FollowUpCase, FollowUpStatus, VerifiedObservationStatus, StructuredInspection } from "../types/followUp";

export default function ExtensionPage() {
  const { profile, user } = useAuth();
  
  // Extension officer's assigned administrative area (default to Mukono if demonstration officer)
  const assignedDistrict = profile?.assignedDistrict || "Mukono";
  
  const [districtFilter] = useState<string>(assignedDistrict);
  const [cases, setCases] = useState<FollowUpCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<FollowUpCase | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [newNote, setNewNote] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<FollowUpStatus>("new");
  const [selectedVerification, setSelectedVerification] = useState<VerifiedObservationStatus>("pending");

  // Structured Field Inspection state
  const [treesInspected, setTreesInspected] = useState<number>(20);
  const [branchesInfested, setBranchesInfested] = useState<number>(0);
  const [entryHolesObserved, setEntryHolesObserved] = useState<boolean>(false);
  const [shadeEstimate, setShadeEstimate] = useState<number>(30);
  const [sanitationRating, setSanitationRating] = useState<"GOOD" | "FAIR" | "POOR">("FAIR");
  const [recommendedActions, setRecommendedActions] = useState<string[]>([
    "Prune affected twigs 5cm below beetle entry hole",
    "Collect infested twigs into bags and burn promptly",
  ]);
  const [inspectionPhoto, setInspectionPhoto] = useState<File | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [casesError, setCasesError] = useState("");
  const [loadingCases, setLoadingCases] = useState(true);
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [casePhotoUrl, setCasePhotoUrl] = useState("");
  const [casePhotoError, setCasePhotoError] = useState("");

  async function refreshCases() {
    setLoadingCases(true);
    setCasesError("");
    try {
    const loaded = await getFollowUpCases(districtFilter);
    setCases(loaded);
    if (!loaded.length) {
      setSelectedCase(null);
    } else if (!selectedCase || !loaded.find((item) => item.id === selectedCase.id)) {
      setSelectedCase(loaded[0]);
      setSelectedStatus(loaded[0].status);
      setSelectedVerification(loaded[0].verifiedObservation);
    } else {
      const refreshedSelection = loaded.find((item) => item.id === selectedCase.id);
      if (refreshedSelection) setSelectedCase(refreshedSelection);
    }
    } catch (error) {
    console.error("Could not load live referral queue.", error);
    setCasesError("Live referrals could not be loaded. Check your connection and account area, then retry.");
    } finally {
    setLoadingCases(false);
    }
  }

  useEffect(() => {
    void refreshCases();
  }, [districtFilter]);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setCasePhotoUrl("");
    setCasePhotoError("");
    if (!selectedCase?.photoUrl) return;

    getBlob(ref(storage, selectedCase.photoUrl)).then((photo) => {
      objectUrl = URL.createObjectURL(photo);
      if (active) setCasePhotoUrl(objectUrl);
      else URL.revokeObjectURL(objectUrl);
    }).catch((error: unknown) => {
      console.error("Could not load consented case photo.", error);
      if (active) setCasePhotoError("The reference photo could not be loaded with this account.");
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedCase?.id, selectedCase?.photoUrl]);

  function handleSelectCase(c: FollowUpCase) {
    setSelectedCase(c);
    setSelectedStatus(c.status);
    setSelectedVerification(c.verifiedObservation);
    if (c.inspection) {
      setTreesInspected(c.inspection.treesInspected || 20);
      setBranchesInfested(c.inspection.branchesInfested || 0);
      setEntryHolesObserved(Boolean(c.inspection.entryHolesObserved));
      setShadeEstimate(c.inspection.shadePercentage || 30);
      setSanitationRating(c.inspection.sanitationRating || "FAIR");
      if (c.inspection.recommendedCulturalActions?.length) {
        setRecommendedActions(c.inspection.recommendedCulturalActions);
      }
    }
    setFeedbackMsg("");
  }

  async function handleUpdateCase(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase || savingUpdate) return;

    setSavingUpdate(true);
    setFeedbackMsg("");
    setCasesError("");
    try {
      let photoStoragePaths: string[] = selectedCase.inspection?.photos || [];
      if (inspectionPhoto) {
        const photoExt = inspectionPhoto.name.split(".").pop() || "jpg";
        const storagePath = `bctb_inspection_photos/${user?.uid || "officer"}/${selectedCase.id}/${Date.now()}.${photoExt}`;
        const photoRef = ref(storage, storagePath);
        await uploadBytes(photoRef, inspectionPhoto);
        photoStoragePaths = [storagePath, ...photoStoragePaths];
      }

      const inspectionPayload: Partial<StructuredInspection> = {
        treesInspected,
        branchesInfested,
        entryHolesObserved,
        shadePercentage: shadeEstimate,
        sanitationRating,
        interviewNotes: newNote.trim(),
        recommendedCulturalActions: recommendedActions,
        photos: photoStoragePaths,
      };

      await updateCaseStatus(
        selectedCase.id,
        selectedStatus,
        selectedVerification,
        newNote,
        inspectionPayload
      );
      setNewNote("");
      setInspectionPhoto(null);
      setFeedbackMsg("Follow-up and structured on-farm inspection saved successfully.");
      await refreshCases();
    } catch (error) {
      console.error("Could not save extension case update.", error);
      setCasesError(error instanceof Error ? error.message : "The update could not be saved.");
    } finally {
      setSavingUpdate(false);
    }
  }

  const filteredCases = cases.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    return true;
  });

  const highRiskCount = cases.filter((c) => c.riskLevel === "HIGH").length;
  const pendingCount = cases.filter((c) => c.status === "new").length;
  const confirmedCount = cases.filter((c) => c.verifiedObservation === "confirmed_bctb").length;

  return (
    <section className="workspace-page extension-page">
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">Robusta Coffee Extension Officer Triage</p>
          <h2>BCTB Field Verification & Follow-Up Portal</h2>
          <p>
            Monitor high-risk screening referrals in your assigned administrative area, verify field symptoms, and maintain an auditable ledger of extension visits.
          </p>
        </div>

        <div className="officer-badge-box">
          <small>Assigned Administrative Area:</small>
          <strong>{districtFilter} District</strong>
          <span className="sub-caption">Officer: {profile?.fullName || "Muwonge David"}</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <div className="panel kpi-card">
          <span className="section-kicker">Urgent Attention</span>
          <h3 className="warning-text">{highRiskCount}</h3>
          <p>High-risk screening cases</p>
        </div>
        {casesError && <div className="form-error" role="alert">{casesError}<button type="button" className="text-button" onClick={() => void refreshCases()}>Retry</button></div>}
        <div className="panel kpi-card">
          <span className="section-kicker">Triage Queue</span>
          <h3>{pendingCount}</h3>
          <p>New referrals awaiting review</p>
        </div>
        <div className="panel kpi-card">
          <span className="section-kicker">Empirical Findings</span>
          <h3 className="success-text">{confirmedCount}</h3>
          <p>Cases with confirmed BCTB beetles</p>
        </div>
      </div>

      {/* Filter and Triage split layout */}
      <div className="extension-workspace-split">
        {/* Left Column: Triage List */}
        <div className="extension-list-col">
          <div className="list-controls">
            <label>
              Filter Status:
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Statuses ({cases.length})</option>
                <option value="new">New referrals</option>
                <option value="reviewed">Under review</option>
                <option value="contacted">Farmer contacted</option>
                <option value="visited">Field visit completed</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
          </div>

          <div className="cases-list" role="list">
            {loadingCases ? (
              <p className="empty-state">Loading live referrals…</p>
            ) : filteredCases.length === 0 ? (
              <p className="empty-state">No cases found matching the criteria in {districtFilter}.</p>
            ) : (
              filteredCases.map((c) => (
                <div
                  key={c.id}
                  className={`case-item ${selectedCase?.id === c.id ? "active" : ""} risk-${c.riskLevel.toLowerCase()}`}
                  onClick={() => handleSelectCase(c)}
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleSelectCase(c)}
                >
                  <div className="case-item-header">
                    <strong>{c.farmerName}</strong>
                    <span className={`risk-tag ${c.riskLevel.toLowerCase()}`}>{c.riskLevel}</span>
                  </div>
                  <div className="case-item-sub">
                    <span>📍 {c.subCounty}, {c.district}</span>
                    <span className="status-pill">{c.status.toUpperCase()}</span>
                  </div>
                  <small className="case-date">Screened: {new Date(c.createdAt).toLocaleDateString()}</small>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Case Details & Action Logger */}
        {selectedCase ? (
          <div className="panel extension-detail-panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker">Case File: {selectedCase.id}</span>
                <h3>{selectedCase.farmerName} — {selectedCase.subCounty}, {selectedCase.district}</h3>
              </div>
              <span className={`risk-badge-lg ${selectedCase.riskLevel.toLowerCase()}`}>
                {selectedCase.riskLevel} Risk Screening
              </span>
            </div>

            {/* Privacy & Consent Verification (Section 25.2 Criteria 6) */}
            <div className={`consent-notice ${selectedCase.followUpConsent ? "consent-granted" : "consent-withheld"}`}>
              {selectedCase.followUpConsent ? (
                <>
                  <span className="consent-icon">✓</span>
                  <div>
                    <strong>Farmer Consent Granted:</strong> Contact and farm location details authorized for extension follow-up.
                    <p className="contact-info">Farmer Contact Phone: <strong>{selectedCase.farmerPhone || "+256 700 000000"}</strong></p>
                  </div>
                </>
              ) : (
                <>
                  <span className="consent-icon">⚠️</span>
                  <div>
                    <strong>Farmer Consent Withheld:</strong> Direct phone and precise coordinates are redacted under privacy rules. Review observations anonymously.
                  </div>
                </>
              )}
            </div>

            {/* Reported Indicators */}
            <div className="detail-section">
              <h4>Reported Pest Signs (Screening Factors)</h4>
              <ul className="factors-list">
                {selectedCase.triggeredFactors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Optional Photo Review (Criteria 7) */}
            {selectedCase.photoUrl && (
              <div className="detail-section">
                <h4>Farmer Attached Reference Photo</h4>
                <div className="case-photo-frame">
                  {casePhotoUrl && <img src={casePhotoUrl} alt="Farmer twig upload" />}
                  {casePhotoError && <p className="form-error" role="alert">{casePhotoError}</p>}
                  {!casePhotoUrl && !casePhotoError && <p>Loading private reference photo…</p>}
                  <small>Attached for visual reference during field inspection.</small>
                </div>
              </div>
            )}

            {/* Action Form: Update Status, Verification & Add Extension Note */}
            <form className="action-form" onSubmit={(event) => void handleUpdateCase(event)}>
              <h4>Extension Officer Field Verification & Action Logger</h4>

              {feedbackMsg && <div className="success-banner">{feedbackMsg}</div>}

              {/* Structured Inspection Protocol */}
              <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h5 style={{ margin: "0 0 12px 0", color: "#2e7d32", fontSize: "0.95rem" }}>
                  📋 On-Farm Structured Inspection (NARO/UCDA Standard)
                </h5>

                <div className="form-row">
                  <label>
                    Trees Inspected (count):
                    <input
                      type="number"
                      min="1"
                      value={treesInspected}
                      onChange={(e) => setTreesInspected(parseInt(e.target.value, 10) || 0)}
                    />
                  </label>
                  <label>
                    Infested Branches Found:
                    <input
                      type="number"
                      min="0"
                      value={branchesInfested}
                      onChange={(e) => setBranchesInfested(parseInt(e.target.value, 10) || 0)}
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    Beetle Pinholes Visible:
                    <select
                      value={entryHolesObserved ? "yes" : "no"}
                      onChange={(e) => setEntryHolesObserved(e.target.value === "yes")}
                    >
                      <option value="yes">Yes (Small ~0.8mm entrance holes on twig underside)</option>
                      <option value="no">No pinholes observed</option>
                    </select>
                  </label>
                  <label>
                    Canopy Shade Estimate (%):
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={shadeEstimate}
                      onChange={(e) => setShadeEstimate(parseInt(e.target.value, 10) || 0)}
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    Farm Sanitation Rating:
                    <select
                      value={sanitationRating}
                      onChange={(e) => setSanitationRating(e.target.value as typeof sanitationRating)}
                    >
                      <option value="GOOD">Good (Twigs regularly pruned & burned)</option>
                      <option value="FAIR">Fair (Some dry prunings on ground)</option>
                      <option value="POOR">Poor (Unmanaged debris & heavy suckers)</option>
                    </select>
                  </label>
                  <label>
                    Attach Inspection Photo:
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setInspectionPhoto(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <div style={{ marginTop: 12 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Prescribed Cultural Management Actions:
                  </span>
                  {[
                    "Prune affected twigs 5cm below beetle entry hole",
                    "Collect infested twigs into bags and burn promptly",
                    "Desucker vigorous orthotropic water shoots",
                    "Regulate shade tree canopy to 20–40%",
                    "Scout weekly for new wilting twigs",
                  ].map((action) => (
                    <label key={action} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", margin: "4px 0" }}>
                      <input
                        type="checkbox"
                        checked={recommendedActions.includes(action)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRecommendedActions([...recommendedActions, action]);
                          } else {
                            setRecommendedActions(recommendedActions.filter((a) => a !== action));
                          }
                        }}
                      />
                      <span>{action}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label>
                  Follow-up Status:
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as FollowUpStatus)}
                  >
                    <option value="new">New (Unreviewed)</option>
                    <option value="reviewed">Reviewed by Officer</option>
                    <option value="contacted">Farmer Contacted via Phone/SMS</option>
                    <option value="visited">Field Visit Completed</option>
                    <option value="resolved">Resolved & Management Completed</option>
                    <option value="referred">Referred to District Coffee Desk</option>
                  </select>
                </label>

                <label>
                  Verified Field Observation:
                  <select
                    value={selectedVerification}
                    onChange={(e) => setSelectedVerification(e.target.value as VerifiedObservationStatus)}
                  >
                    <option value="pending">Pending Field Inspection</option>
                    <option value="confirmed_bctb">Confirmed BCTB (Xylosandrus compactus)</option>
                    <option value="not_confirmed">Not Confirmed (No beetles or entry holes)</option>
                    <option value="unconfirmed">Unconfirmed (Inconclusive)</option>
                    <option value="other_pest_or_condition">Other Condition (e.g. Fusarium wilt / Drought)</option>
                  </select>
                </label>
              </div>

              <label>
                Extension Advisory & Interview Notes:
                <textarea
                  rows={3}
                  placeholder="Record observations (e.g. twigs dissected, presence of female beetles, pruning advice given)..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </label>

              <button className="primary-button" type="submit" disabled={savingUpdate}>
                {savingUpdate ? "Saving securely…" : "Save Follow-Up & Audit Record"}
              </button>
            </form>

            {/* Display Previous Structured Inspection Findings */}
            {selectedCase.inspection && (
              <div className="detail-section" style={{ background: "#e8f5e9", padding: 14, borderRadius: 8 }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#1b5e20" }}>Recorded Field Inspection Findings</h4>
                <p style={{ margin: "4px 0", fontSize: "0.85rem" }}>
                  <strong>Trees Inspected:</strong> {selectedCase.inspection.treesInspected} | <strong>Infested Branches:</strong> {selectedCase.inspection.branchesInfested} | <strong>Pinholes:</strong> {selectedCase.inspection.entryHolesObserved ? "Yes" : "No"}
                </p>
                <p style={{ margin: "4px 0", fontSize: "0.85rem" }}>
                  <strong>Shade Canopy:</strong> {selectedCase.inspection.shadePercentage}% | <strong>Sanitation:</strong> {selectedCase.inspection.sanitationRating}
                </p>
                {selectedCase.inspection.recommendedCulturalActions?.length > 0 && (
                  <ul style={{ margin: "6px 0 0 16px", fontSize: "0.82rem" }}>
                    {selectedCase.inspection.recommendedCulturalActions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Extension Notes History */}
            <div className="detail-section">
              <h4>Logged Extension Notes ({selectedCase.notes.length})</h4>
              {selectedCase.notes.length === 0 ? (
                <p className="sub-note">No extension notes logged yet for this case.</p>
              ) : (
                <div className="notes-stack">
                  {selectedCase.notes.map((n) => (
                    <div className="note-card" key={n.id}>
                      <div className="note-meta">
                        <strong>{n.officerName}</strong>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p>{n.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Timeline (Criteria 11 & 12) */}
            <div className="detail-section">
              <h4>Traceable Action History & Audit Log</h4>
              <div className="timeline-list">
                {selectedCase.timeline.map((t, i) => (
                  <div className="timeline-item" key={i}>
                    <span className="timeline-dot" />
                    <div>
                      <strong>{t.action}</strong>
                      <div className="timeline-meta">
                        <span>By {t.performedBy}</span> · <span>{new Date(t.timestamp).toLocaleString()}</span>
                      </div>
                      {t.details && <p className="timeline-details">"{t.details}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="panel empty-case-placeholder">
            <p>Select a case from the triage queue on the left to review details and record follow-up actions.</p>
          </div>
        )}
      </div>
    </section>
  );
}
