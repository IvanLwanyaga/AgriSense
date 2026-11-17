import { useEffect, useMemo, useState } from "react";
import { predictResearchBctbRisk } from "../services/researchBctbModelService";
import type { ResearchBctbModelInputs, ResearchBctbPrediction } from "../types/bctb";

const RISK_LABELS = { HIGH: "High", MODERATE: "Moderate", LOW: "Low" } as const;

export default function WhatIfRiskExplorer({
  inputs,
  baseline,
  rainfall30dMm,
}: {
  inputs: ResearchBctbModelInputs;
  baseline: ResearchBctbPrediction;
  rainfall30dMm: number | null;
}) {
  const initialScenario = useMemo(() => ({
    farm_sanitation: baseline.counterfactual?.changes.farm_sanitation as ResearchBctbModelInputs["farm_sanitation"] || inputs.farm_sanitation,
    pruning_frequency: baseline.counterfactual?.changes.pruning_frequency as ResearchBctbModelInputs["pruning_frequency"] || inputs.pruning_frequency,
  }), [baseline.counterfactual, inputs.farm_sanitation, inputs.pruning_frequency]);
  const [sanitation, setSanitation] = useState(initialScenario.farm_sanitation);
  const [pruning, setPruning] = useState(initialScenario.pruning_frequency);
  const [rainfall, setRainfall] = useState(Math.min(2000, Math.max(0, rainfall30dMm ?? 0)));
  const [includeRainfall, setIncludeRainfall] = useState(rainfall30dMm !== null);
  const [result, setResult] = useState<ResearchBctbPrediction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSanitation(initialScenario.farm_sanitation);
    setPruning(initialScenario.pruning_frequency);
    setRainfall(Math.min(2000, Math.max(0, rainfall30dMm ?? 0)));
    setIncludeRainfall(rainfall30dMm !== null);
    setResult(null);
    setError("");
  }, [initialScenario, rainfall30dMm]);

  const rainfallChanged = includeRainfall && (inputs.rainfall_30d_mm === null || rainfall !== inputs.rainfall_30d_mm);
  const changedInputs = sanitation !== inputs.farm_sanitation || pruning !== inputs.pruning_frequency || rainfallChanged;

  async function compareScenario() {
    setBusy(true); setError("");
    try {
      setResult(await predictResearchBctbRisk({
        ...inputs,
        farm_sanitation: sanitation,
        pruning_frequency: pruning,
        rainfall_30d_mm: includeRainfall ? rainfall : inputs.rainfall_30d_mm,
      }, { includeCounterfactual: false }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The what-if comparison is unavailable.");
    } finally { setBusy(false); }
  }

  const counterfactual = baseline.counterfactual;
  const hasCounterfactual = counterfactual?.status !== "NO_FEASIBLE_COUNTERFACTUAL"
    && Boolean(counterfactual?.change_details?.length || Object.keys(counterfactual?.changes || {}).length);

  return <section className="panel what-if-panel" aria-labelledby="what-if-title">
    <div className="what-if-heading">
      <div><span className="section-kicker">Interactive decision support</span><h3 id="what-if-title">Explore a management what-if</h3></div>
      <span className="what-if-model-tag">SYNTHETIC MODEL</span>
    </div>
    <p className="what-if-disclaimer">Change management inputs or test a rainfall reading and run the expanded API model. This compares outputs from synthetic labels; it does not estimate real-world intervention effects or field risk.</p>

    <div className="what-if-comparison">
      <article className={`what-if-score risk-${baseline.predicted_risk.toLowerCase()}`}>
        <small>Current inputs</small><strong>{RISK_LABELS[baseline.predicted_risk]}</strong>
        <span>{(baseline.class_probabilities[baseline.predicted_risk] * 100).toFixed(1)}% uncalibrated class output</span>
      </article>
      <span className="what-if-arrow" aria-hidden="true">→</span>
      <article className={`what-if-score${result ? ` risk-${result.predicted_risk.toLowerCase()}` : " empty"}`} aria-live="polite">
        <small>Changed inputs</small><strong>{result ? RISK_LABELS[result.predicted_risk] : "Run comparison"}</strong>
        <span>{result ? `${(result.class_probabilities[result.predicted_risk] * 100).toFixed(1)}% uncalibrated class output` : "No scenario calculated yet"}</span>
      </article>
    </div>

    <div className="what-if-controls">
      <label>Farm sanitation
        <select value={sanitation} onChange={(event) => setSanitation(event.target.value as ResearchBctbModelInputs["farm_sanitation"])}>
          <option value="good">Good</option><option value="moderate">Moderate</option><option value="poor">Poor</option>
        </select>
      </label>
      <label>Pruning frequency
        <select value={pruning} onChange={(event) => setPruning(event.target.value as ResearchBctbModelInputs["pruning_frequency"])}>
          <option value="regular">Regular</option><option value="occasional">Occasional</option><option value="rare">Rare</option>
        </select>
      </label>
      <label className="what-if-rainfall"><span><input type="checkbox" checked={includeRainfall} onChange={(event) => setIncludeRainfall(event.target.checked)} /> Test a rainfall value</span><strong>{rainfall.toFixed(0)} mm / 30 days</strong>
        <input type="range" min="0" max="2000" step="10" value={rainfall} disabled={!includeRainfall} onChange={(event) => setRainfall(Number(event.target.value))} />
        <small>Rainfall is a model input now. Its modeled effect comes from synthetic labels, not validated farm outcomes.</small>
      </label>
    </div>
    <div className="what-if-actions">
      <button className="primary-button" type="button" onClick={() => void compareScenario()} disabled={busy || !changedInputs}>
        {busy ? "Calculating…" : "Compare changed inputs"}
      </button>
      {!changedInputs && <small>Change sanitation, pruning, or enable and adjust rainfall to run a comparison.</small>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}

    {baseline.predicted_risk === "HIGH" && <div className="what-if-counterfactual">
      <h4>Smallest management change found by the model</h4>
      {hasCounterfactual ? <>
        <ul>{(counterfactual?.change_details || Object.entries(counterfactual?.changes || {}).map(([feature, to]) => ({ feature, to, from: inputs[feature as keyof ResearchBctbModelInputs] }))).map((change) => (
          <li key={change.feature}><strong>{change.feature.replace(/_/g, " ")}</strong>: {String(change.from)} → {String(change.to)}</li>
        ))}</ul>
        {typeof counterfactual?.target_class_score === "number" && <small>Target LOW class output: {(counterfactual.target_class_score * 100).toFixed(1)}% (uncalibrated synthetic-model output)</small>}
      </> : <p>No permitted sanitation/pruning change flipped this input to LOW in the current model. Keep the field observations unchanged and request on-farm verification.</p>}
      {counterfactual?.disclaimer && <small>{counterfactual.disclaimer}</small>}
    </div>}
  </section>;
}
