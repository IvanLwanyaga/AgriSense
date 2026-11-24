import { authenticatedFetch } from "./authenticatedFetch";
import type {
  BctbRiskLevel,
  ResearchBctbModelInputs,
  ResearchBctbPrediction,
} from "../types/bctb";

type ShapContribution = ResearchBctbPrediction["shap_contributions"][number];
const RISK_LEVELS: BctbRiskLevel[] = ["LOW", "MODERATE", "HIGH"];
const RESEARCH_MODEL_FEATURE_COUNT = 34;

function isRiskLevel(value: unknown): value is BctbRiskLevel {
  return value === "LOW" || value === "MODERATE" || value === "HIGH";
}

function isProbabilityRecord(value: unknown): value is Record<BctbRiskLevel, number> {
  if (typeof value !== "object" || value === null) return false;
  const probabilities = value as Record<string, unknown>;
  return RISK_LEVELS.every((level) =>
    typeof probabilities[level] === "number"
    && Number.isFinite(probabilities[level])
    && probabilities[level] >= 0
    && probabilities[level] <= 1)
    && Math.abs(RISK_LEVELS.reduce(
      (sum, level) => sum + Number(probabilities[level]),
      0
    ) - 1) <= 0.01;
}

function isShapContribution(value: unknown): value is ShapContribution {
  if (typeof value !== "object" || value === null) return false;
  const contribution = value as Record<string, unknown>;
  return typeof contribution.feature === "string"
    && typeof contribution.value === "string"
    && typeof contribution.contribution === "number"
    && Number.isFinite(contribution.contribution)
    && ["SUPPORTS_PREDICTION", "OPPOSES_PREDICTION", "NEUTRAL"].includes(String(contribution.direction));
}

export async function predictResearchBctbRisk(
  modelInputs: ResearchBctbModelInputs,
  options: { includeCounterfactual?: boolean } = {},
): Promise<ResearchBctbPrediction> {
  const response = await authenticatedFetch("/api/predictResearchBctb", {
    method: "POST",
    body: JSON.stringify({ modelInputs, includeCounterfactual: options.includeCounterfactual !== false }),
  });
  const responseText = await response.text();
  let payload: unknown;
  try {
    payload = responseText ? JSON.parse(responseText) as unknown : {};
  } catch {
    payload = {};
  }
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "The Firebase prediction function was not found (404). Stop and restart the local app with `npm run dev` from the project root so Functions rebuilds and loads predictResearchBctb."
      );
    }
    const error = typeof payload === "object" && payload !== null
      && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : responseText.trim().slice(0, 300) || `Research model request failed (HTTP ${response.status}).`;
    throw new Error(error);
  }

  if (typeof payload !== "object" || payload === null) {
    throw new Error("The research model returned an invalid response.");
  }
  const prediction = payload as Record<string, unknown>;
  const contributions = prediction.shap_contributions;
  if (
    !isRiskLevel(prediction.predicted_risk)
    || !isProbabilityRecord(prediction.class_probabilities)
    || !Array.isArray(contributions)
    || contributions.length === 0
    || !contributions.every(isShapContribution)
    || !Array.isArray(prediction.actionable_steps)
    || prediction.actionable_steps.length === 0
    || !prediction.actionable_steps.every((step) => typeof step === "string" && step.length > 0)
    || typeof prediction.model_name !== "string"
    || !prediction.model_name
    || typeof prediction.model_artifact !== "string"
    || !prediction.model_artifact
    || prediction.model_status !== "RESEARCH_ONLY_SYNTHETIC_LABELS"
    || typeof prediction.input_count !== "number"
    || prediction.input_count < 7
    || prediction.input_count > RESEARCH_MODEL_FEATURE_COUNT
    || prediction.input_total !== RESEARCH_MODEL_FEATURE_COUNT
    || typeof prediction.disclaimer !== "string"
    || !prediction.disclaimer
  ) {
    throw new Error(
  "The Render BCTB prediction API was not found. Check the Render deployment and API route."
);
  }

  return {
    predicted_risk: prediction.predicted_risk,
    class_probabilities: prediction.class_probabilities,
    shap_contributions: contributions,
    top_shap_contributions: Array.isArray(prediction.top_shap_contributions)
      ? prediction.top_shap_contributions as ShapContribution[]
      : contributions.slice().sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 3),
    counterfactual: prediction.counterfactual && typeof prediction.counterfactual === "object"
      ? prediction.counterfactual as ResearchBctbPrediction["counterfactual"]
      : null,
    recommendations: prediction.recommendations && typeof prediction.recommendations === "object"
      ? prediction.recommendations as ResearchBctbPrediction["recommendations"]
      : undefined,
    actionable_steps: prediction.actionable_steps,
    model_name: prediction.model_name,
    model_artifact: prediction.model_artifact,
    model_status: prediction.model_status,
    input_count: prediction.input_count,
    input_total: prediction.input_total,
    disclaimer: prediction.disclaimer,
  };
}
