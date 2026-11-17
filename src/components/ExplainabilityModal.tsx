import { useState } from "react";
import type { AgriculturalRecommendation } from "../types/recommendation";

interface ExplainabilityModalProps {
  recommendation: AgriculturalRecommendation | null;
  onClose: () => void;
}

export default function ExplainabilityModal({
  recommendation,
  onClose,
}: ExplainabilityModalProps) {
  const [activeTab, setActiveTab] = useState<"FARMER" | "TECHNICAL">("FARMER");

  if (!recommendation) return null;

  const { explainability } = recommendation;
  const confidencePercent = Math.round(recommendation.confidenceScore * 100);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content xai-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-badge-row">
            <span className={`priority-tag ${recommendation.priority.toLowerCase()}`}>
              {recommendation.priority} Priority
            </span>
            <span className="model-tag">Model: {recommendation.modelVersion}</span>
          </div>
          <h2>{recommendation.title}</h2>
          <p className="modal-subtitle">
            Explainable AI (XAI) Insight · Decision Support Transparency
          </p>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </header>

        {/* Tab Selector */}
        <div className="xai-tab-nav">
          <button
            className={`xai-tab ${activeTab === "FARMER" ? "active" : ""}`}
            onClick={() => setActiveTab("FARMER")}
          >
            🌾 Farmer Advisory Explanation
          </button>
          <button
            className={`xai-tab ${activeTab === "TECHNICAL" ? "active" : ""}`}
            onClick={() => setActiveTab("TECHNICAL")}
          >
            🔬 Technical (SHAP ) Inspector
          </button>
        </div>

        <div className="modal-body">
          {activeTab === "FARMER" ? (
            <div className="farmer-xai-view">
              {/* The Tripartite Core Answer from Section 1 & 9 */}
              <div className="tripartite-block">
                <div className="tripartite-item">
                  <div className="t-icon">👁️</div>
                  <div>
                    <strong>What is happening on your farm?</strong>
                    <p>{recommendation.whatIsHappening}</p>
                  </div>
                </div>

                <div className="tripartite-item">
                  <div className="t-icon">💡</div>
                  <div>
                    <strong>Why is this happening?</strong>
                    <p>{recommendation.whyItIsHappening}</p>
                  </div>
                </div>

                <div className="tripartite-item highlight">
                  <div className="t-icon">🌱</div>
                  <div>
                    <strong>What should you do about it?</strong>
                    <p>{recommendation.suggestedAction}</p>
                  </div>
                </div>
              </div>

              {/* Contributing Factors in Farmer-Friendly Language */}
              <div className="xai-section">
                <h3>Major Contributing Factors Influencing this Recommendation</h3>
                <p className="section-note">
                  The AI weighs environmental and sensor readings to understand which factors had the strongest influence:
                </p>

                <div className="factors-list">
                  {explainability.topDrivers.map((driver) => (
                    <div className="factor-card" key={driver.featureName}>
                      <div className="factor-head">
                        <div>
                          <strong>{driver.featureLabel}</strong>
                          <span className="observed-val">Observed: {driver.observedValue}</span>
                        </div>
                        <span className={`impact-badge ${driver.direction.toLowerCase()}`}>
                          {driver.direction === "INCREASES_PROBABILITY" ? "↑ Strong Push" : "↓ Moderating Factor"}
                          ({driver.relativeImportancePercentage}%)
                        </span>
                      </div>
                      <div className="factor-bar-track">
                        <div
                          className={`factor-bar-fill ${driver.direction.toLowerCase()}`}
                          style={{ width: `${driver.relativeImportancePercentage}%` }}
                        />
                      </div>
                      <p className="driver-explanation">{driver.farmerExplanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidence & Advisory Safety Disclaimer */}
              <div className="confidence-card">
                <div className="conf-header">
                  <span>System Decision Confidence</span>
                  <strong>{confidencePercent}%</strong>
                </div>
                <div className="conf-track">
                  <div className="conf-fill" style={{ width: `${confidencePercent}%` }} />
                </div>
                <p className="advisory-safety-note">
                  🛡️ <strong>Advisory Note:</strong> AgriSense recommendations are designed to assist your agricultural judgement. Local field conditions, crop variety traits, and recent field management should be considered alongside this advice.
                </p>
              </div>
            </div>
          ) : (
            <div className="technical-xai-view">
              <div className="tech-meta-grid">
                <div className="meta-box">
                  <small>MODEL IDENTIFIER</small>
                  <strong>{recommendation.modelVersion}</strong>
                </div>
                <div className="meta-box">
                  <small>PREDICTED VALUE</small>
                  <strong>{explainability.predictedValue}</strong>
                </div>
                <div className="meta-box">
                  <small>BASE VALUE (E[f(X)])</small>
                  <strong>{explainability.baseValue}</strong>
                </div>
                <div className="meta-box">
                  <small>LIME LOCAL FIDELITY (R²)</small>
                  <strong>{explainability.limeSummary.localR2Score}</strong>
                </div>
              </div>

              {/* SHAP Waterfall / Feature Attribution */}
              <div className="tech-section">
                <h4>SHAP (Shapley Additive Explanations) Attribution Matrix</h4>
                <p className="tech-sub">
                  Marginal Shapley values quantify the exact contribution of each feature towards deviating from the base rate ({explainability.baseValue}):
                </p>

                <div className="shap-table">
                  <div className="shap-table-header">
                    <span>Feature</span>
                    <span>Observed Input</span>
                    <span>SHAP Value (ϕ)</span>
                    <span>Effect</span>
                  </div>
                  {explainability.shapSummary.features.map((feat) => (
                    <div className="shap-table-row" key={feat.featureName}>
                      <span className="tech-feature-name">
                        <code>{feat.featureName}</code>
                      </span>
                      <span>{feat.observedValue}</span>
                      <span className={`shap-val ${feat.shapValue >= 0 ? "pos" : "neg"}`}>
                        {feat.shapValue >= 0 ? `+${feat.shapValue}` : feat.shapValue}
                      </span>
                      <span className="tech-direction">
                        {feat.shapValue >= 0 ? "Pushes towards action" : "Restrains action"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* LIME Local Linear Explainer */}
              <div className="tech-section">
                <h4>LIME (Local Interpretable Model-agnostic Explanations) Surrogate</h4>
                <p className="tech-sub">
                  Local decision boundaries fitted via an interpretable linear surrogate around the current farm telemetry instance:
                </p>
                <div className="lime-rules-list">
                  {explainability.limeSummary.featureWeights.map((w, idx) => (
                    <div className="lime-rule-card" key={idx}>
                      <div className="lime-rule-condition">
                        <code>IF {w.condition}</code>
                        <span className="lime-weight-pill">
                          Weight: {w.weight >= 0 ? `+${w.weight.toFixed(3)}` : w.weight.toFixed(3)}
                        </span>
                      </div>
                      <small className="lime-desc">{w.description}</small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Lineage */}
              <div className="tech-section">
                <h4>Audit & Compliance Lineage</h4>
                <div className="audit-box">
                  <p><strong>Generated At:</strong> {recommendation.generatedAt}</p>
                  <p><strong>Telemetry Quality State:</strong> <code>{recommendation.dataQualityStatus}</code></p>
                  <p><strong>Auditor Notes:</strong> {explainability.technicalAuditorNotes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="modal-footer">
          <button className="primary-button" onClick={onClose}>
            Done Reviewing Explanation
          </button>
        </footer>
      </div>
    </div>
  );
}

