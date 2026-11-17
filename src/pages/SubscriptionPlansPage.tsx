import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/useAuth";
import {
  getSubscriptionPlans,
  getUserSubscriptionTier,
  submitSubscriptionUpgradeRequest,
} from "../services/subscriptionService";
import { reviewSubscriptionRequest as submitSubscriptionReview } from "../services/adminService";
import type { SubscriptionRequest, SubscriptionTier } from "../types/subscription";

export default function SubscriptionPlansPage() {
  const { profile } = useAuth();
  const currentTier = getUserSubscriptionTier(profile);
  const plans = getSubscriptionPlans();
  const isPlatformAdmin = profile?.role === "PLATFORM_ADMIN";

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | null>(null);
  const [requestNotes, setRequestNotes] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingRequests, setPendingRequests] = useState<SubscriptionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [reviewingRequestId, setReviewingRequestId] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");

  useEffect(() => {
    if (!isPlatformAdmin) return;
    return onSnapshot(
      query(collection(db, "subscriptionRequests"), where("status", "==", "PENDING")),
      (snapshot) => {
        setPendingRequests(snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }) as SubscriptionRequest));
        setLoadingRequests(false);
        setReviewError("");
      },
      (cause) => {
        console.error("Could not load subscription requests.", cause);
        setReviewError("Could not load subscription requests. Check administrator permissions.");
        setLoadingRequests(false);
      },
    );
  }, [isPlatformAdmin]);

  async function handleUpgradeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !selectedPlan) return;
    if (selectedPlan === "ORGANISATION" && !organizationName.trim()) {
      setErrorMessage("Enter the organization name for this request.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await submitSubscriptionUpgradeRequest(profile, selectedPlan, requestNotes, organizationName);
      setSuccessMessage(
        `Your upgrade request for ${selectedPlan === "FARMER_PLUS" ? "Farmer Plus" : "Organisation Tier"} has been recorded. Our team will activate your expanded entitlements shortly.`
      );
      setSelectedPlan(null);
      setRequestNotes("");
      setOrganizationName("");
    } catch (err: unknown) {
      console.error("Upgrade request failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubscriptionReview(requestId: string, approve: boolean) {
    if (!isPlatformAdmin || reviewingRequestId) return;
    setReviewingRequestId(requestId);
    setReviewError("");
    setReviewNotice("");
    try {
      await submitSubscriptionReview(requestId, approve ? "APPROVE" : "REJECT");
      setReviewNotice(approve ? "Subscription request approved." : "Subscription request rejected.");
    } catch (cause) {
      console.error("Could not review subscription request.", cause);
      setReviewError(cause instanceof Error ? cause.message : "The request could not be reviewed.");
    } finally {
      setReviewingRequestId("");
    }
  }

  return (
    <div className="settings-page" style={{ maxWidth: "1120px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <span style={{
          display: "inline-block",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          color: "#2d6a4f",
          background: "#d8f3dc",
          padding: "4px 12px",
          borderRadius: "16px",
          marginBottom: "8px",
        }}>
          AgriSense Commercial Platform
        </span>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#111827", margin: "0 0 10px 0" }}>
          Plans & Entitlements
        </h1>
        <p style={{ fontSize: "16px", color: "#4b5563", maxWidth: "680px", margin: "0 auto" }}>
          From individual Robusta coffee smallholders in Mukono and Masaka to commercial estates and nationwide cooperatives, AgriSense scales with your agricultural operations.
        </p>
      </div>

      {successMessage && (
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #86efac",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "32px",
          color: "#166534",
          fontSize: "14px",
          textAlign: "center",
        }}>
          ✓ {successMessage}
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
        gap: "24px",
        marginBottom: "48px",
      }}>
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.id;
          return (
            <div
              key={plan.id}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "32px 24px",
                border: plan.highlight ? "2px solid #2d6a4f" : "1px solid #e5e7eb",
                boxShadow: plan.highlight ? "0 12px 30px rgba(45, 106, 79, 0.15)" : "0 4px 12px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {plan.highlight && (
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#2d6a4f",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  padding: "4px 14px",
                  borderRadius: "12px",
                }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px 0", color: "#111827" }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, minHeight: "38px" }}>
                  {plan.tagline}
                </p>
              </div>

              {/* Price display */}
              <div style={{ marginBottom: "20px", borderBottom: "1px solid #f3f4f6", paddingBottom: "16px" }}>
                {plan.priceUGX === 0 ? (
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#1b4332" }}>
                    Free <span style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280" }}>/ smallholder</span>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: "28px", fontWeight: 800, color: "#1b4332" }}>
                      UGX {plan.priceUGX.toLocaleString()}
                    </span>
                    <span style={{ fontSize: "14px", color: "#6b7280" }}> / month</span>
                    <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                      ≈ ${plan.priceUSD} USD / month
                    </div>
                  </div>
                )}
              </div>

              {/* Limits Summary */}
              <div style={{
                background: "#f9fafb",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#374151",
              }}>
                <div><strong>Farm Limit:</strong> {plan.limits.maxFarms === 1 ? "1 Registered Farm" : `Up to ${plan.limits.maxFarms} Farms`}</div>
                <div><strong>IoT Sensors:</strong> {plan.limits.iotSensorsAllowed ? "✓ Included" : "✕ Not included"}</div>
                <div><strong>PDF Reports:</strong> {plan.limits.exportReportsAllowed ? "✓ Exportable" : "✕ Standard View"}</div>
              </div>

              {/* Features List */}
              <ul style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 24px 0",
                fontSize: "13px",
                color: "#4b5563",
                flex: 1,
              }}>
                {plan.features.map((feat, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                    <span style={{ color: "#2d6a4f", fontWeight: "bold" }}>✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {isCurrent ? (
                <div style={{
                  textAlign: "center",
                  padding: "10px",
                  background: "#d8f3dc",
                  color: "#1b4332",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "14px",
                }}>
                  Current Active Plan
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: plan.highlight ? "#2d6a4f" : "#1f2937",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                >
                  {plan.id === "ORGANISATION" ? "Inquire for Cooperative" : "Upgrade to Plus →"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isPlatformAdmin && (
        <section aria-labelledby="subscription-requests-title" style={{ marginBottom: "40px" }}>
          <h2 id="subscription-requests-title" style={{ color: "#1b4332" }}>Pending subscription requests</h2>
          {reviewNotice && <p className="form-success" role="status">{reviewNotice}</p>}
          {reviewError && <p className="form-error" role="alert">{reviewError}</p>}
          {loadingRequests ? (
            <div className="panel" role="status">Loading subscription requests…</div>
          ) : pendingRequests.length === 0 ? (
            <div className="panel">There are no subscription requests awaiting review.</div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {pendingRequests.map((item) => {
                const requestId = item.id || "";
                return (
                  <article className="panel" key={requestId} style={{ padding: "18px" }}>
                    <h3 style={{ margin: "0 0 6px", color: "#111827" }}>
                      {item.planId === "ORGANISATION" ? "Organisation" : "Farmer Plus"} request
                    </h3>
                    <p style={{ margin: "0 0 8px", color: "#4b5563" }}>
                      {item.userName} · {item.userEmail}
                      {item.organizationName ? ` · ${item.organizationName}` : ""}
                    </p>
                    {item.notes && <p style={{ margin: "0 0 12px", color: "#6b7280" }}>{item.notes}</p>}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="outline-button"
                        onClick={() => void handleSubscriptionReview(requestId, false)}
                        disabled={!requestId || Boolean(reviewingRequestId)}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => void handleSubscriptionReview(requestId, true)}
                        disabled={!requestId || Boolean(reviewingRequestId)}
                      >
                        {reviewingRequestId === requestId ? "Reviewing…" : "Approve and activate"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Upgrade Modal */}
      {selectedPlan && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          zIndex: 9999,
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            maxWidth: "500px",
            width: "100%",
            padding: "28px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", color: "#111827" }}>
              Request Upgrade: {selectedPlan === "FARMER_PLUS" ? "Farmer Plus" : "Organisation Tier"}
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#6b7280" }}>
              Confirm your subscription upgrade request. Backend administrator will review and activate your commercial entitlements.
            </p>

            {errorMessage && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #f87171",
                borderRadius: "6px",
                padding: "10px",
                marginBottom: "14px",
                fontSize: "13px",
                color: "#991b1b",
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleUpgradeSubmit}>
              {selectedPlan === "ORGANISATION" && (
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>
                  Organization name
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    maxLength={120}
                    autoComplete="organization"
                    style={{
                      display: "block",
                      width: "100%",
                      boxSizing: "border-box",
                      marginTop: "6px",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "13px",
                    }}
                  />
                </label>
              )}
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                Notes or Cooperative Details (Optional)
                <textarea
                  rows={3}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="e.g. Mukono Coffee Growers Cooperative with 85 outgrower farmers requiring satellite mapping."
                  style={{
                    display: "block",
                    width: "100%",
                    boxSizing: "border-box",
                    marginTop: "6px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                  }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(null);
                    setErrorMessage("");
                  }}
                  style={{
                    background: "#f3f4f6",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontSize: "14px",
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: "#2d6a4f",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: submitting ? "wait" : "pointer",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Upgrade Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
