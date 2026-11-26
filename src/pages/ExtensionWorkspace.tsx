import { useState, useEffect, useMemo } from "react";
import { getBlob, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase/config";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { getFollowUpCases, updateCaseStatus } from "../services/bctbAssessmentService";
import { getDistrictFarms } from "../services/firestoreService";
import { sendRealSmsAlert } from "../services/smsService";
import HelpRoomPage from "./HelpRoomPage";
import type { Farm } from "../types/farm";
import type {
  FollowUpCase,
  FollowUpStatus,
  VerifiedObservationStatus,
  StructuredInspection,
} from "../types/followUp";
import type { AppPage } from "../types/navigation";

export type ExtensionTab =
  | "overview"
  | "farmers-farms"
  | "farm-reports"
  | "verification"
  | "help-room"
  | "inspections"
  | "recommendations"
  | "my-profile";

interface ExtensionWorkspaceProps {
  initialTab?: ExtensionTab;
  onNavigate?: (page: AppPage) => void;
}

export default function ExtensionWorkspace({
  initialTab = "overview",
  onNavigate,
}: ExtensionWorkspaceProps) {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const assignedDistrict = profile?.assignedDistrict || "Mukono";
  const assignedSubCounty = profile?.assignedSubCounty || "Kyampisi";

  const [activeTab, setActiveTab] = useState<ExtensionTab>(initialTab);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cases, setCases] = useState<FollowUpCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Search & Filtering
  const [farmSearch, setFarmSearch] = useState("");
  const [reportFilter, setReportFilter] = useState<string>("ALL");
  const [verificationFilter, setVerificationFilter] = useState<string>("ALL");
  const [selectedCase, setSelectedCase] = useState<FollowUpCase | null>(null);

  // Verification Form State
  const [newStatus, setNewStatus] = useState<FollowUpStatus>("reviewed");
  const [newVerification, setNewVerification] = useState<VerifiedObservationStatus>("pending");
  const [extensionNote, setExtensionNote] = useState("");
  const [savingVerification, setSavingVerification] = useState(false);

  // Structured Inspection Form State
  const [inspectionFarmId, setInspectionFarmId] = useState<string>("");
  const [inspectionVerification, setInspectionVerification] = useState<VerifiedObservationStatus>("pending");
  const [treesInspected, setTreesInspected] = useState<number>(25);
  const [branchesInfested, setBranchesInfested] = useState<number>(3);
  const [entryHolesObserved, setEntryHolesObserved] = useState<boolean>(true);
  const [shadeEstimate, setShadeEstimate] = useState<number>(30);
  const [sanitationRating, setSanitationRating] = useState<"GOOD" | "FAIR" | "POOR">("FAIR");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [recommendedActions, setRecommendedActions] = useState<string[]>([
    "Prune affected twigs 5cm below beetle entry hole",
    "Collect infested twigs into bags and burn promptly",
    "Desucker vigorous orthotropic basal water shoots",
  ]);
  const [inspectionPhoto, setInspectionPhoto] = useState<File | null>(null);
  const [savingInspection, setSavingInspection] = useState(false);

  // Photo modal & preview state
  const [activePhotoUrl, setActivePhotoUrl] = useState<string>("");
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [activeVoiceUrl, setActiveVoiceUrl] = useState("");
  const [smsSending, setSmsSending] = useState(false);

  // Load live data for officer's assigned district
  async function loadWorkspaceData() {
    setLoading(true);
    setError("");
    try {
      const [loadedFarms, loadedCases] = await Promise.all([
        getDistrictFarms(assignedDistrict),
        getFollowUpCases(assignedDistrict),
      ]);
      setFarms(loadedFarms);
      setCases(loadedCases);
      if (loadedCases.length > 0 && !selectedCase) {
        setSelectedCase(loadedCases[0]);
        setNewStatus(loadedCases[0].status);
        setNewVerification(loadedCases[0].verifiedObservation);
        setInspectionFarmId(loadedCases[0].farmId);
      }
    } catch (err) {
      console.error("Could not load extension workspace data:", err);
      setError("Unable to load live district records. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspaceData();
  }, [assignedDistrict]);

  // Sync initial tab changes if passed as prop
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Load photo blob from storage if selected case has photoUrl
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setActivePhotoUrl("");
    if (!selectedCase?.photoUrl) return;

    setLoadingPhoto(true);
    getBlob(ref(storage, selectedCase.photoUrl))
      .then((photo) => {
        objectUrl = URL.createObjectURL(photo);
        if (active) setActivePhotoUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch((e) => {
        console.warn("Could not load case photo:", e);
      })
      .finally(() => {
        if (active) setLoadingPhoto(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedCase?.id, selectedCase?.photoUrl]);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setActiveVoiceUrl("");
    if (!selectedCase?.voiceNoteUrl) return;
    getBlob(ref(storage, selectedCase.voiceNoteUrl)).then((voice) => {
      objectUrl = URL.createObjectURL(voice);
      if (active) setActiveVoiceUrl(objectUrl);
      else URL.revokeObjectURL(objectUrl);
    }).catch((error: unknown) => console.warn("Could not load farmer voice note.", error));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedCase?.id, selectedCase?.voiceNoteUrl]);

  // Computed KPI Metrics
  const assignedFarmersCount = useMemo(() => {
    return new Set(farms.map((f) => f.farmerId)).size;
  }, [farms]);

  const reportsToReviewCount = useMemo(() => {
    return cases.filter((c) => c.status === "new" || c.status === "reviewed").length;
  }, [cases]);

  const highRiskAlertsCount = useMemo(() => {
    return cases.filter((c) => c.riskLevel === "HIGH" && c.status !== "resolved").length;
  }, [cases]);

  const verifiedReportsCount = useMemo(() => {
    return cases.filter(
      (c) =>
        c.verifiedObservation === "confirmed_bctb" ||
        c.verifiedObservation === "not_confirmed" ||
        c.verifiedObservation === "other_pest_or_condition" ||
        c.status === "visited" ||
        c.status === "resolved"
    ).length;
  }, [cases]);

  // Handle Verification Form Submission
  async function handleSaveVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase || savingVerification) return;
    setSavingVerification(true);
    setActionMessage("");
    setError("");

    try {
      await updateCaseStatus(
        selectedCase.id,
        newStatus,
        newVerification,
        extensionNote.trim() || undefined
      );
      setActionMessage("✓ Verification status and audit notes recorded successfully.");
      setExtensionNote("");
      await loadWorkspaceData();
    } catch (err) {
      console.error("Verification update error:", err);
      setError(err instanceof Error ? err.message : "Failed to save verification update.");
    } finally {
      setSavingVerification(false);
    }
  }

  // Handle Structured Physical Inspection Form Submission
  async function handleSaveInspection(e: React.FormEvent) {
    e.preventDefault();
    if (savingInspection) return;
    setSavingInspection(true);
    setActionMessage("");
    setError("");

    try {
      let photoPaths: string[] = [];
      if (inspectionPhoto) {
        const photoExt = inspectionPhoto.name.split(".").pop() || "jpg";
        const storagePath = `bctb_inspection_photos/${user?.uid || "officer"}/${Date.now()}.${photoExt}`;
        const photoRef = ref(storage, storagePath);
        await uploadBytes(photoRef, inspectionPhoto);
        photoPaths = [storagePath];
      }

      const inspectionPayload: Partial<StructuredInspection> = {
        treesInspected,
        branchesInfested,
        entryHolesObserved,
        shadePercentage: shadeEstimate,
        sanitationRating,
        interviewNotes: inspectionNotes.trim(),
        recommendedCulturalActions: recommendedActions,
        photos: photoPaths,
        inspectedAt: new Date().toISOString(),
        inspectedBy: profile?.fullName || "Agricultural Extension Officer",
        officerId: user?.uid || "officer",
      };

      // Match target case file or create log
      const targetCase = cases.find((c) => c.farmId === inspectionFarmId) || selectedCase;
      if (targetCase) {
        await updateCaseStatus(
          targetCase.id,
          "visited",
          inspectionVerification,
          `Physical on-farm inspection completed. Inspected ${treesInspected} trees, ${branchesInfested} infested branches.`,
          inspectionPayload
        );
      }

      setActionMessage("✓ On-farm physical inspection saved and added to official audit ledger.");
      setInspectionNotes("");
      setInspectionPhoto(null);
      await loadWorkspaceData();
    } catch (err) {
      console.error("Inspection save error:", err);
      setError(err instanceof Error ? err.message : "Failed to record inspection.");
    } finally {
      setSavingInspection(false);
    }
  }

  // Quick SMS Dispatch to Farmer
  async function handleSendQuickSms(phone: string, farmerName: string, message: string) {
    if (!phone || smsSending) return;
    setSmsSending(true);
    setActionMessage("");
    try {
      await sendRealSmsAlert({
        recipientPhone: phone,
        farmerName,
        farmName: selectedCase?.farmName || "Robusta coffee farm",
        shortAdvice: message,
        category: "BCTB_EARLY_WARNING",
        farmerId: selectedCase?.farmerId,
      });
      setActionMessage(`✓ SMS advisory successfully dispatched to ${farmerName} (${phone}).`);
    } catch (err) {
      console.error("SMS dispatch error:", err);
      setError("SMS could not be delivered. Make sure the phone number has a valid +256 prefix.");
    } finally {
      setSmsSending(false);
    }
  }

  return (
    <div className="workspace-page extension-workspace" style={{ maxWidth: 1200, margin: "0 auto", padding: "16px" }}>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {loading && <div className="panel" role="status" style={{ marginBottom: 16 }}>Loading assigned district farms and reports…</div>}

      {/* 1. EXTENSION WORKSPACE HEADER & TOP KPI BAR                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header
        style={{
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
          color: "#ffffff",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 24,
          boxShadow: "0 8px 24px rgba(27, 67, 50, 0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span
              style={{
                display: "inline-block",
                background: "#d8f3dc",
                color: "#1b4332",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
                padding: "4px 10px",
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              AgriSense – {t.extensionPortal}
            </span>
            <h1 style={{ margin: "0 0 6px 0", fontSize: 26, fontWeight: 800 }}>
              {profile?.fullName || t.roleOfficerText}
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "#d8f3dc" }}>
              <strong>{t.officerRole}:</strong> {t.roleOfficerText} · <strong>{t.assignedAreaCard}:</strong> {assignedDistrict} {t.districtWord} ({assignedSubCounty} {t.subCountyWord})
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => void loadWorkspaceData()}
              className="outline-button"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}
            >
              {t.refreshDataBtn}
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("map")}
                className="outline-button"
                style={{ background: "#ffffff", color: "#1b4332", fontWeight: 700 }}
              >
                {t.viewDistrictMapBtn}
              </button>
            )}
          </div>
        </div>

        {/* The 4 Core Header Metrics Requested by User */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.2)",
            paddingTop: 20,
          }}
        >
          <div
            onClick={() => setActiveTab("farmers-farms")}
            style={{ cursor: "pointer", background: "rgba(255,255,255,0.08)", padding: "12px 16px", borderRadius: 10 }}
          >
            <div style={{ fontSize: 12, color: "#d8f3dc", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t.assignedFarmersMetric}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#ffffff" }}>{assignedFarmersCount}</div>
            <div style={{ fontSize: 11, color: "#b7e4c7" }}>{t.assignedFarmersHelp} ({assignedDistrict})</div>
          </div>

          <div
            onClick={() => setActiveTab("farm-reports")}
            style={{ cursor: "pointer", background: "rgba(255,255,255,0.08)", padding: "12px 16px", borderRadius: 10 }}
          >
            <div style={{ fontSize: 12, color: "#d8f3dc", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t.reportsToReviewMetric}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#ffffff" }}>{reportsToReviewCount}</div>
            <div style={{ fontSize: 11, color: "#b7e4c7" }}>{t.reportsToReviewHelp}</div>
          </div>

          <div
            onClick={() => setActiveTab("verification")}
            style={{ cursor: "pointer", background: "rgba(239, 68, 68, 0.2)", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(239, 68, 68, 0.4)" }}
          >
            <div style={{ fontSize: 12, color: "#fecaca", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t.highRiskCasesMetric}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fecaca" }}>{highRiskAlertsCount}</div>
            <div style={{ fontSize: 11, color: "#fee2e2" }}>{t.highRiskCasesHelp}</div>
          </div>

          <div
            onClick={() => setActiveTab("inspections")}
            style={{ cursor: "pointer", background: "rgba(255,255,255,0.08)", padding: "12px 16px", borderRadius: 10 }}
          >
            <div style={{ fontSize: 12, color: "#d8f3dc", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t.verifiedReportsMetric}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#95d5b2" }}>{verifiedReportsCount}</div>
            <div style={{ fontSize: 11, color: "#b7e4c7" }}>{t.verifiedReportsHelp}</div>
          </div>
        </div>
      </header>

      {/* Global Alerts & Notifications */}
      {actionMessage && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#166534", fontSize: 14 }}>
          {actionMessage}
        </div>
      )}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #f87171", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#991b1b", fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. THE 8 EXTENSION WORKSPACE NAVIGATION TABS                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Extension Workspace Navigation"
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: 24,
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        {[
          { id: "overview", label: t.tabOverview, icon: "📊" },
          { id: "farmers-farms", label: t.tabFarmersFarms, icon: "🌱" },
          { id: "farm-reports", label: t.tabFarmReports, icon: "📋" },
          { id: "verification", label: t.tabVerification, icon: "🔍" },
          { id: "help-room", label: t.tabHelpRoom, icon: "💬" },
          { id: "inspections", label: t.tabInspections, icon: "✅" },
          { id: "recommendations", label: t.tabRecommendations, icon: "📚" },
          { id: "my-profile", label: t.tabMyProfile, icon: "👤" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ExtensionTab)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                borderRadius: "8px 8px 0 0",
                border: "none",
                background: isActive ? "#2d6a4f" : "transparent",
                color: isActive ? "#ffffff" : "#4b5563",
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: OVERVIEW                                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }}>
            {/* Urgent Verification Queue Card */}
            <div className="panel" style={{ padding: 22, borderTop: "4px solid #dc2626" }}>
              <span className="section-kicker" style={{ color: "#dc2626" }}>Urgent Priority</span>
              <h3 style={{ margin: "4px 0 8px 0" }}>High-Risk Screening Triage</h3>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px 0" }}>
                Farmers in your district reporting acute twig dieback and beetle entrance holes.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cases.filter((c) => c.riskLevel === "HIGH" && c.status !== "resolved").slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedCase(c); setActiveTab("verification"); }}
                    style={{
                      padding: "10px 12px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 14, color: "#991b1b" }}>{c.farmerName}</strong>
                      <div style={{ fontSize: 12, color: "#7f1d1d" }}>📍 {c.subCounty} · Flagged: {c.triggeredFactors.slice(0, 2).join(", ")}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>Verify →</span>
                  </div>
                ))}
                {cases.filter((c) => c.riskLevel === "HIGH" && c.status !== "resolved").length === 0 && (
                  <p style={{ fontSize: 13, color: "#166534", margin: 0 }}>✓ No unresolved high-risk alerts in {assignedDistrict}.</p>
                )}
              </div>
            </div>

            {/* Quick Action Navigator */}
            <div className="panel" style={{ padding: 22 }}>
              <span className="section-kicker">Field Desk</span>
              <h3 style={{ margin: "4px 0 8px 0" }}>Fast Actions for Extension</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("inspections")}
                  className="primary-button"
                  style={{ textAlign: "left", justifyContent: "space-between", display: "flex", width: "100%", padding: "12px 16px" }}
                >
                  <span>📋 Record Physical Farm Inspection</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("farmers-farms")}
                  className="outline-button"
                  style={{ textAlign: "left", justifyContent: "space-between", display: "flex", width: "100%", padding: "12px 16px" }}
                >
                  <span>🌱 Browse Registered Farms ({farms.length})</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("help-room")}
                  className="outline-button"
                  style={{ textAlign: "left", justifyContent: "space-between", display: "flex", width: "100%", padding: "12px 16px" }}
                >
                  <span>💬 Answer Farmer Questions in Help Room</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("recommendations")}
                  className="outline-button"
                  style={{ textAlign: "left", justifyContent: "space-between", display: "flex", width: "100%", padding: "12px 16px" }}
                >
                  <span>📚 Access Non-Chemical IPM Guidelines</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>

          {/* District Status Overview */}
          <div className="panel" style={{ padding: 22 }}>
            <h3 style={{ margin: "0 0 12px 0" }}>District Coffee Health Summary · {assignedDistrict}</h3>
            <p style={{ fontSize: 14, color: "#4b5563" }}>
              Agricultural extension surveillance monitors Black Coffee Twig Borer (<em>Xylosandrus compactus</em>) incidence across {assignedDistrict} sub-counties.
              Physical verification on-farm is essential before chemical or cultural interventions are finalized.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 16 }}>
              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>Registered Coffee Farms</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{farms.length} Properties</div>
                <div style={{ fontSize: 11, color: "#475569" }}>Total {farms.reduce((acc, f) => acc + (f.area || 0), 0).toFixed(1)} ha under watch</div>
              </div>
              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>Screening Submissions</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{cases.length} Total Reports</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{cases.filter((c) => c.status === "visited").length} physical visits logged</div>
              </div>
              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>Confirmed BCTB Incidents</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#b91c1c" }}>
                  {cases.filter((c) => c.verifiedObservation === "confirmed_bctb").length} Verified Sites
                </div>
                <div style={{ fontSize: 11, color: "#475569" }}>Dissected & pinholes confirmed</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: FARMERS & FARMS                                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "farmers-farms" && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: 22 }}>Registered Farmers & Robusta Coffee Farms</h2>
              <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                Directory of farmers and growing blocks located in {assignedDistrict} District.
              </p>
            </div>
            <input
              type="text"
              value={farmSearch}
              onChange={(e) => setFarmSearch(e.target.value)}
              placeholder="Search by farmer, farm, or sub-county…"
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 260 }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {farms
              .filter((f) => {
                const term = farmSearch.toLowerCase();
                return (
                  !term ||
                  f.name.toLowerCase().includes(term) ||
                  f.subCounty?.toLowerCase().includes(term) ||
                  f.village?.toLowerCase().includes(term) ||
                  f.district.toLowerCase().includes(term)
                );
              })
              .map((farm) => {
                const linkedCase = cases.find((c) => c.farmId === farm.id);
                const isSuspicious = linkedCase && linkedCase.riskLevel !== "LOW" && linkedCase.status !== "resolved";

                return (
                  <article
                    key={farm.id}
                    className="panel"
                    style={{
                      padding: 18,
                      border: isSuspicious ? "1.5px solid #ef4444" : "1px solid #e5e7eb",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <span className="section-kicker">{farm.subCounty || farm.district}</span>
                          <h3 style={{ margin: "2px 0 4px 0", fontSize: 18 }}>{farm.name}</h3>
                        </div>
                        {isSuspicious ? (
                          <span style={{ background: "#fee2e2", color: "#dc2626", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                            ⚠️ SUSPICIOUS BCTB SIGNS
                          </span>
                        ) : (
                          <span style={{ background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                            NORMAL STATUS
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 12 }}>
                        <div><strong>Farmer:</strong> {linkedCase?.farmerName || "Registered Farmer"}</div>
                        <div><strong>Location:</strong> {[farm.village, farm.parish, farm.subCounty, farm.district].filter(Boolean).join(", ")}</div>
                        <div><strong>Acreage:</strong> {farm.area || 1.5} ha ({farm.coffeeAcreage || 2.0} acres coffee)</div>
                        <div><strong>Coffee Variety:</strong> {farm.coffeeVariety ? farm.coffeeVariety.replace(/_/g, " ") : "Robusta CWDr Clonal"}</div>
                        <div><strong>Coordinates:</strong> {farm.location?.latitude?.toFixed(5) || "0.3542"}, {farm.location?.longitude?.toFixed(5) || "32.7531"}</div>
                      </div>

                      {linkedCase && (
                        <div style={{ background: "#f8fafc", padding: 10, borderRadius: 6, fontSize: 12, marginBottom: 12, border: "1px solid #e2e8f0" }}>
                          <strong>Latest Screening:</strong> {linkedCase.riskLevel} Risk ({linkedCase.status.replace(/_/g, " ")})
                          <div style={{ color: "#64748b" }}>{linkedCase.triggeredFactors.slice(0, 2).join(" · ") || "Standard observations"}</div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setInspectionFarmId(farm.id);
                          setActiveTab("inspections");
                        }}
                        className="primary-button"
                        style={{ fontSize: 12, padding: "8px 12px", flex: 1 }}
                      >
                        Record Inspection
                      </button>
                      {linkedCase && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCase(linkedCase);
                            setActiveTab("verification");
                          }}
                          className="outline-button"
                          style={{ fontSize: 12, padding: "8px 12px" }}
                        >
                          Review Report
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: FARM REPORTS                                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "farm-reports" && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: 22 }}>Review Farm Observations & Reports</h2>
              <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                Farmer-submitted symptoms, dieback counts, entrance holes, and uploaded photographs.
              </p>
            </div>
            <select
              value={reportFilter}
              onChange={(e) => setReportFilter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}
            >
              <option value="ALL">All Reports ({cases.length})</option>
              <option value="HIGH">High Risk Screening</option>
              <option value="MODERATE">Moderate Risk</option>
              <option value="new">New / Unreviewed</option>
              <option value="visited">Field Visit Completed</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {cases
              .filter((c) => {
                if (reportFilter === "ALL") return true;
                if (reportFilter === "HIGH" || reportFilter === "MODERATE") return c.riskLevel === reportFilter;
                return c.status === reportFilter;
              })
              .map((c) => (
                <div key={c.id} className="panel" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <span className="section-kicker">Report #{c.id.slice(0, 8)}</span>
                      <h3 style={{ margin: "2px 0 4px 0", fontSize: 18 }}>{c.farmerName}</h3>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>📍 {c.subCounty}, {c.district} · Screened: {new Date(c.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: c.riskLevel === "HIGH" ? "#fee2e2" : "#fef3c7",
                        color: c.riskLevel === "HIGH" ? "#b91c1c" : "#92400e",
                      }}
                    >
                      {c.riskLevel} RISK
                    </span>
                  </div>

                  {/* Reported Symptoms Breakdown */}
                  <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 12, border: "1px solid #e2e8f0" }}>
                    <strong style={{ fontSize: 12, color: "#1e293b", display: "block", marginBottom: 6 }}>
                      Reported Symptoms & Field Observations:
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                      {c.triggeredFactors.map((factor, idx) => (
                        <li key={idx}><strong>{factor}</strong></li>
                      ))}
                    </ul>
                  </div>

                  {/* Photo & Voice Note Review */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                    {c.photoUrl ? (
                      <span style={{ fontSize: 12, color: "#15803d", display: "flex", alignItems: "center", gap: 4 }}>
                        📷 Reference photo attached
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>No photo attached</span>
                    )}

                    {c.voiceNoteUrl ? (
                      <span style={{ fontSize: 12, color: "#0284c7", display: "flex", alignItems: "center", gap: 4 }}>
                        🎙 Voice note available
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>· Direct text screening</span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCase(c);
                        setActiveTab("verification");
                      }}
                      className="primary-button"
                      style={{ fontSize: 12, padding: "8px 12px", flex: 1 }}
                    >
                      Verify Case & Take Action
                    </button>
                    {c.farmerPhone && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleSendQuickSms(
                            c.farmerPhone || "",
                            c.farmerName,
                            `Hello ${c.farmerName}, your AgriSense BCTB report has been reviewed by your sub-county extension officer. Please inspect twigs and prune 5cm below holes.`
                          )
                        }
                        className="outline-button"
                        style={{ fontSize: 12, padding: "8px 12px" }}
                        disabled={smsSending}
                      >
                        Send SMS Alert
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: VERIFICATION                                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "verification" && (
        <section>
          {/* Important Scientific Disclaimer Banner */}
          <div
            style={{
              background: "#fffbeb",
              borderLeft: "4px solid #f59e0b",
              borderRadius: 8,
              padding: "14px 18px",
              marginBottom: 20,
              fontSize: 13,
              color: "#92400e",
              lineHeight: 1.5,
            }}
          >
            <strong>Crucial Verification Standard (NARO/UCDA):</strong> An AI risk warning is a predictive early indicator based on farmer-reported observations—it is <em>not confirmation of infestation</em>. Formal confirmation requires on-farm physical inspection, checking for entrance pinholes (~0.8mm) on the underside of twigs, and dissecting twigs to observe <em>Xylosandrus compactus</em> beetles or ambrosia fungal staining.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {/* Left Queue */}
            <div className="panel" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>Triage Referral Queue</h3>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12 }}
                >
                  <option value="ALL">All ({cases.length})</option>
                  <option value="pending">Pending Field Inspection</option>
                  <option value="confirmed_bctb">Confirmed BCTB</option>
                  <option value="not_confirmed">Not Confirmed</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflowY: "auto" }}>
                {cases
                  .filter((c) => {
                    if (verificationFilter === "ALL") return true;
                    return c.verifiedObservation === verificationFilter;
                  })
                  .map((c) => {
                    const isSelected = selectedCase?.id === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCase(c);
                          setNewStatus(c.status);
                          setNewVerification(c.verifiedObservation);
                          setInspectionFarmId(c.farmId);
                        }}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          cursor: "pointer",
                          border: isSelected ? "2px solid #2d6a4f" : "1px solid #e5e7eb",
                          background: isSelected ? "#f0fdf4" : "#ffffff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong>{c.farmerName}</strong>
                          <span style={{ fontSize: 11, fontWeight: 700, color: c.riskLevel === "HIGH" ? "#dc2626" : "#d97706" }}>
                            {c.riskLevel}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", margin: "4px 0" }}>
                          📍 {c.subCounty} · Status: <strong>{c.status.replace(/_/g, " ").toUpperCase()}</strong>
                        </div>
                        <div style={{ fontSize: 11, color: "#166534" }}>
                          Verification: {c.verifiedObservation.replace(/_/g, " ")}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Case Verification Editor */}
            {selectedCase ? (
              <div className="panel" style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <span className="section-kicker">Case File #{selectedCase.id}</span>
                    <h3 style={{ margin: "2px 0", fontSize: 20 }}>{selectedCase.farmerName}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                      📍 {selectedCase.subCounty}, {selectedCase.district} · Phone: {selectedCase.farmerPhone || "Contact in file"}
                    </p>
                  </div>
                  <span style={{ background: selectedCase.riskLevel === "HIGH" ? "#fee2e2" : "#fef3c7", color: selectedCase.riskLevel === "HIGH" ? "#dc2626" : "#b45309", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                    {selectedCase.riskLevel} RISK SCREENING
                  </span>
                </div>

                {/* Reference Photo Display if available */}
                {activePhotoUrl && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Farmer Uploaded Reference Photo:</div>
                    <img src={activePhotoUrl} alt="Twig reference" style={{ maxHeight: 200, borderRadius: 8, border: "1px solid #d1d5db" }} />
                  </div>
                )}
                {loadingPhoto && <p role="status">Loading farmer photo…</p>}
                {activeVoiceUrl && <div style={{ marginBottom: 16 }}><strong style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Farmer voice note</strong><audio controls src={activeVoiceUrl} style={{ width: "100%" }}>Audio playback is not supported by this browser.</audio>{selectedCase.voiceTranscription && <p>{selectedCase.voiceTranscription}</p>}</div>}
                {selectedCase.symptoms && <div className="settings-info-card"><strong>Farmer-reported observations</strong><p>{[
                  selectedCase.symptoms.twigDieback && "Twig dieback",
                  selectedCase.symptoms.entryHoles && "Entry holes",
                  selectedCase.symptoms.yellowing && "Leaf yellowing",
                  selectedCase.symptoms.blackening && "Twig blackening",
                  selectedCase.symptoms.wilting && "Wilting",
                  selectedCase.symptoms.drying && "Drying",
                ].filter(Boolean).join(" · ") || "No symptom indicators selected"}{typeof selectedCase.symptoms.affectedTwigCount === "number" ? ` · ${selectedCase.symptoms.affectedTwigCount} affected twigs reported` : ""}</p></div>}
                {selectedCase.observationsHistory?.length ? <div className="settings-info-card"><strong>Previous observations</strong>{selectedCase.observationsHistory.map((entry, index) => <p key={entry.id || `${entry.date}-${index}`}>{new Date(entry.date).toLocaleString()} · {entry.riskLevel}{typeof entry.score === "number" ? ` · score ${entry.score}` : ""}{entry.notes ? ` · ${entry.notes}` : ""}</p>)}</div> : null}

                {/* Verification Form */}
                <form onSubmit={handleSaveVerification}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>
                      Follow-up Casework Status:
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as FollowUpStatus)}
                        style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                      >
                        <option value="new">New (Unreviewed)</option>
                        <option value="reviewed">Under Review by Officer</option>
                        <option value="contacted">Farmer Contacted</option>
                        <option value="visited">Field Inspection Completed</option>
                        <option value="resolved">Resolved & Actions Completed</option>
                        <option value="referred">Referred to District Coffee Desk</option>
                      </select>
                    </label>

                    <label style={{ fontSize: 13, fontWeight: 600 }}>
                      Verified Field Assessment:
                      <select
                        value={newVerification}
                        onChange={(e) => setNewVerification(e.target.value as VerifiedObservationStatus)}
                        style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                      >
                        <option value="pending">Pending Physical Inspection</option>
                        <option value="confirmed_bctb">Confirmed BCTB (Xylosandrus compactus)</option>
                        <option value="not_confirmed">Not Confirmed (No beetles or holes)</option>
                        <option value="unconfirmed">Inconclusive / Further Watch Needed</option>
                        <option value="other_pest_or_condition">Other Condition (Fusarium / Drought)</option>
                      </select>
                    </label>
                  </div>

                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                    Officer Verification Findings & Notes:
                    <textarea
                      rows={3}
                      value={extensionNote}
                      onChange={(e) => setExtensionNote(e.target.value)}
                      placeholder="Record inspection date, twig dissection notes, presence of white sawdust frass or entry holes, and farmer guidance given…"
                      style={{ display: "block", width: "100%", marginTop: 4, padding: "10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                    />
                  </label>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="submit"
                      disabled={savingVerification}
                      className="primary-button"
                      style={{ flex: 1, padding: "10px 16px" }}
                    >
                      {savingVerification ? "Saving Verification…" : "Save Verification Status & Audit Entry"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectionFarmId(selectedCase.farmId);
                        setActiveTab("inspections");
                      }}
                      className="outline-button"
                      style={{ padding: "10px 16px", fontWeight: 700 }}
                    >
                      Conduct Inspection →
                    </button>
                  </div>
                </form>

                {/* Audit Timeline */}
                <div style={{ marginTop: 20, borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: 14, color: "#1e293b" }}>Auditable Case Action History:</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 160, overflowY: "auto" }}>
                    {selectedCase.timeline.map((event, idx) => (
                      <div key={idx} style={{ fontSize: 12, color: "#475569", borderLeft: "3px solid #2d6a4f", paddingLeft: 8 }}>
                        <strong>{event.action}</strong> · {new Date(event.timestamp).toLocaleDateString()} by {event.performedBy}
                        {event.details && <div style={{ color: "#64748b" }}>"{event.details}"</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="panel" style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
                Select a referral from the list on the left to verify symptoms and update case status.
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: FARMER HELP ROOM                                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "help-room" && (
        <section>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: 22 }}>Farmer Help Room · Extension Support</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              Direct dialogue with coffee farmers. Answer agronomic inquiries, clarify BCTB warnings, and recommend non-chemical cultural practices.
            </p>
          </div>
          <HelpRoomPage />
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: INSPECTIONS                                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "inspections" && (
        <section>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: 22 }}>Structured On-Farm Inspection Suite</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              NARO/UCDA Standard protocol for physical twig sampling, canopy shade estimation, and farm sanitation assessment.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
            {/* Record New Physical Inspection */}
            <div className="panel" style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: 18, color: "#166534" }}>📋 Record New Farm Visit</h3>
              <form onSubmit={handleSaveInspection}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                  Select Farm for Inspection:
                  <select
                    value={inspectionFarmId}
                    onChange={(e) => setInspectionFarmId(e.target.value)}
                    style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="">Choose a farm…</option>
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.subCounty || f.district})
                      </option>
                    ))}
                  </select>
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    Trees Inspected (Sample Size):
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={treesInspected}
                      onChange={(e) => setTreesInspected(parseInt(e.target.value, 10) || 20)}
                      style={{ display: "block", width: "100%", marginTop: 4, padding: "8px", borderRadius: 6, border: "1px solid #d1d5db" }}
                    />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    Infested Branches Found:
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={branchesInfested}
                      onChange={(e) => setBranchesInfested(parseInt(e.target.value, 10) || 0)}
                      style={{ display: "block", width: "100%", marginTop: 4, padding: "8px", borderRadius: 6, border: "1px solid #d1d5db" }}
                    />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    Entrance Pinholes Confirmed:
                    <select
                      value={entryHolesObserved ? "yes" : "no"}
                      onChange={(e) => setEntryHolesObserved(e.target.value === "yes")}
                      style={{ display: "block", width: "100%", marginTop: 4, padding: "8px", borderRadius: 6, border: "1px solid #d1d5db" }}
                    >
                      <option value="yes">Yes (0.8mm hole on underside)</option>
                      <option value="no">No pinholes observed</option>
                    </select>
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    Canopy Shade Estimate (%):
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={shadeEstimate}
                      onChange={(e) => setShadeEstimate(parseInt(e.target.value, 10) || 30)}
                      style={{ display: "block", width: "100%", marginTop: 4, padding: "8px", borderRadius: 6, border: "1px solid #d1d5db" }}
                    />
                  </label>
                </div>

                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                  Farm Sanitation Rating:
                  <select
                    value={sanitationRating}
                    onChange={(e) => setSanitationRating(e.target.value as typeof sanitationRating)}
                    style={{ display: "block", width: "100%", marginTop: 4, padding: "8px", borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="GOOD">Good (Twigs regularly pruned & burned off-farm)</option>
                    <option value="FAIR">Fair (Some dry clipped prunings left on ground)</option>
                    <option value="POOR">Poor (Heavy unmanaged suckers & breeding debris)</option>
                  </select>
                </label>

                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                  Field assessment conclusion (screening and pinholes alone do not confirm BCTB):
                  <select value={inspectionVerification} onChange={(e) => setInspectionVerification(e.target.value as VerifiedObservationStatus)} style={{ display: "block", width: "100%", marginTop: 4, padding: "8px", borderRadius: 6, border: "1px solid #d1d5db" }}>
                    <option value="pending">Pending further assessment</option>
                    <option value="confirmed_bctb">Confirmed BCTB after appropriate field assessment</option>
                    <option value="not_confirmed">Not confirmed after field assessment</option>
                    <option value="unconfirmed">Inconclusive</option>
                    <option value="other_pest_or_condition">Other pest or condition</option>
                  </select>
                </label>

                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Prescribed IPM Cultural Actions:
                  </span>
                  {[
                    "Prune affected twigs 5cm below beetle entry hole",
                    "Collect infested twigs into bags and burn promptly",
                    "Desucker vigorous orthotropic basal water shoots",
                    "Regulate shade tree canopy to 20–40% filtered light",
                    "Weekly farm scouting during dry season transitions",
                  ].map((action) => (
                    <label key={action} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, margin: "4px 0" }}>
                      <input
                        type="checkbox"
                        checked={recommendedActions.includes(action)}
                        onChange={(e) => {
                          if (e.target.checked) setRecommendedActions([...recommendedActions, action]);
                          else setRecommendedActions(recommendedActions.filter((a) => a !== action));
                        }}
                      />
                      <span>{action}</span>
                    </label>
                  ))}
                </div>

                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                  Attach Field Photo (Evidence):
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setInspectionPhoto(e.target.files?.[0] || null)}
                    style={{ display: "block", marginTop: 4, fontSize: 12 }}
                  />
                </label>

                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                  Inspection Findings & Farmer Guidance:
                  <textarea
                    rows={3}
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    placeholder="Document twig dissections, beetles observed, farmer interview details, and next scheduled inspection date…"
                    style={{ display: "block", width: "100%", marginTop: 4, padding: "8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12 }}
                  />
                </label>

                <button
                  type="submit"
                  disabled={savingInspection}
                  className="primary-button"
                  style={{ width: "100%", padding: "10px" }}
                >
                  {savingInspection ? "Saving Inspection Record…" : "Save Official Inspection Record"}
                </button>
              </form>
            </div>

            {/* Historical Log of Completed Inspections */}
            <div className="panel" style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: 18 }}>📜 Inspection History & Ledger</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 580, overflowY: "auto" }}>
                {cases
                  .filter((c) => c.inspection)
                  .map((c) => (
                    <div key={c.id} style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>{c.farmerName}</strong>
                        <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          INSPECTED
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", margin: "4px 0" }}>
                        📍 {c.subCounty} · Date: {c.inspection?.inspectedAt ? new Date(c.inspection.inspectedAt).toLocaleDateString() : "Recent"}
                      </div>
                      <div style={{ fontSize: 12, color: "#334155", margin: "4px 0" }}>
                        Trees: <strong>{c.inspection?.treesInspected}</strong> · Infested Branches: <strong>{c.inspection?.branchesInfested}</strong> · Pinholes: <strong>{c.inspection?.entryHolesObserved ? "Yes" : "No"}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: "#334155" }}>
                        Sanitation: <strong>{c.inspection?.sanitationRating}</strong> · Canopy Shade: <strong>{c.inspection?.shadePercentage}%</strong>
                      </div>
                      {c.inspection?.interviewNotes && (
                        <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#475569", fontStyle: "italic" }}>
                          "{c.inspection.interviewNotes}"
                        </p>
                      )}
                    </div>
                  ))}
                {cases.filter((c) => c.inspection).length === 0 && (
                  <p style={{ color: "#64748b", fontSize: 13 }}>No physical inspections recorded yet. Submit your first inspection above.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 7: RECOMMENDATIONS                                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "recommendations" && (
        <section>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: 22 }}>Extension Agricultural Recommendations Library</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              Practical, non-chemical cultural management guidance approved by NARO & UCDA for Robusta coffee farmers.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
            <article className="panel" style={{ padding: 20, borderLeft: "4px solid #2d6a4f" }}>
              <span className="section-kicker">Core IPM Practice</span>
              <h3 style={{ margin: "4px 0 8px 0" }}>1. Sanitary Pruning Protocol</h3>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>
                Prune infested twigs at least <strong>5 cm (2 inches) below the lowest beetle entrance hole</strong>. Use sharp secateurs to avoid tearing bark. Prune early in the morning before female beetles take flight.
              </p>
              <div style={{ background: "#f0fdf4", padding: 10, borderRadius: 6, fontSize: 12, color: "#166534" }}>
                ✓ Prevents beetles from retreating down the main stem.
              </div>
            </article>

            <article className="panel" style={{ padding: 20, borderLeft: "4px solid #b45309" }}>
              <span className="section-kicker">Destruction Protocol</span>
              <h3 style={{ margin: "4px 0 8px 0" }}>2. Twig Bagging & Burning</h3>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>
                Place all pruned twigs directly into airtight synthetic sacks on-site. <strong>Do not leave prunings on the ground</strong> as beetles emerge and re-infest neighboring trees. Burn sacks and prunings completely off-farm.
              </p>
              <div style={{ background: "#fef3c7", padding: 10, borderRadius: 6, fontSize: 12, color: "#92400e" }}>
                ⚠️ Burning kills the symbiotic ambrosia fungus and pupae inside the galleries.
              </div>
            </article>

            <article className="panel" style={{ padding: 20, borderLeft: "4px solid #0284c7" }}>
              <span className="section-kicker">Canopy & Microclimate</span>
              <h3 style={{ margin: "4px 0 8px 0" }}>3. Shade Regulation (20–40%)</h3>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>
                BCTB thrives in dark, humid microclimates with dense tree canopies. Regulate shade trees (<em>Albizia coriaria, Ficus natalensis, Cordia africana</em>) so coffee receives <strong>20% to 40% filtered sunlight</strong>.
              </p>
              <div style={{ background: "#f0f9ff", padding: 10, borderRadius: 6, fontSize: 12, color: "#0369a1" }}>
                ✓ Adequate sunlight reduces relative humidity within the tree canopy below beetle thresholds.
              </div>
            </article>

            <article className="panel" style={{ padding: 20, borderLeft: "4px solid #7c3aed" }}>
              <span className="section-kicker">Shoot Management</span>
              <h3 style={{ margin: "4px 0 8px 0" }}>4. Basal Desuckering</h3>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>
                Strip off vigorously growing orthotropic water suckers at the base of coffee stems. Soft, sappy suckers are the primary breeding ground where founding female beetles bore during drought spells.
              </p>
              <div style={{ background: "#f5f3ff", padding: 10, borderRadius: 6, fontSize: 12, color: "#6d28d9" }}>
                ✓ Channels tree vigor into cherry-bearing plagiotropic branches.
              </div>
            </article>

            <article className="panel" style={{ padding: 20, borderLeft: "4px solid #dc2626" }}>
              <span className="section-kicker">Diagnostic Guide</span>
              <h3 style={{ margin: "4px 0 8px 0" }}>5. BCTB vs. Disease Mimics</h3>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>
                Differentiate BCTB from Coffee Bark Disease and Fusarium Wilt. BCTB is definitively identified by <strong>tiny ~0.8mm round pinholes</strong> on twig undersides and dry brown leaves clinging to dead branches.
              </p>
              <div style={{ background: "#fef2f2", padding: 10, borderRadius: 6, fontSize: 12, color: "#991b1b" }}>
                🔍 Fusarium wilt affects whole trees with internal vascular browning; BCTB begins on individual twigs.
              </div>
            </article>

            <article className="panel" style={{ padding: 20, borderLeft: "4px solid #059669" }}>
              <span className="section-kicker">Scouting Routine</span>
              <h3 style={{ margin: "4px 0 8px 0" }}>6. Weekly Dry Season Scouting</h3>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>
                Advise farmers to walk their blocks weekly, particularly between December–February and June–August. Inspect 20 random trees per acre; inspect the undersides of primary and secondary twigs.
              </p>
              <div style={{ background: "#ecfdf5", padding: 10, borderRadius: 6, fontSize: 12, color: "#065f46" }}>
                ✓ Early detection allows removal of the first founding generation of beetles.
              </div>
            </article>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 8: MY PROFILE                                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "my-profile" && (
        <section>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div className="panel" style={{ padding: 28, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#2d6a4f",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 700,
                  }}
                >
                  {profile?.fullName ? profile.fullName.charAt(0) : "O"}
                </div>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: 22 }}>{profile?.fullName || "Extension Officer"}</h2>
                  <div style={{ fontSize: 13, color: "#2d6a4f", fontWeight: 700 }}>
                    Agricultural Extension Officer · Government Verified
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Staff ID: {profile?.staffId || "UG-MAAIF-EXT-2024-884"} · Organization: {profile?.organizationName || "Mukono District Local Government"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13, borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
                <div><strong>Assigned Administrative District:</strong> <div>{assignedDistrict} District</div></div>
                <div><strong>Assigned Sub-County:</strong> <div>{assignedSubCounty} Sub-County</div></div>
                <div><strong>Official Contact Phone:</strong> <div>{profile?.phone || "+256 772 000000"}</div></div>
                <div><strong>Email Address:</strong> <div>{profile?.email || user?.email || "officer@agrisense.ug"}</div></div>
                <div><strong>Account Status:</strong> <div style={{ color: "#166534", fontWeight: 700 }}>✓ ACTIVE & AUTHORIZED</div></div>
                <div><strong>Role Permissions:</strong> <div>District Casework, Inspection Ledger, Verification Desk</div></div>
              </div>
            </div>

            {/* Officer Activity Ledger */}
            <div className="panel" style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Officer Casework Ledger & Performance</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Assigned Farmers</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{assignedFarmersCount}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Physical Inspections</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{cases.filter((c) => c.inspection).length}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Resolved Casework</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{cases.filter((c) => c.status === "resolved").length}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
