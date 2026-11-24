import type {
  BctbAssessmentInput,
  BctbFieldReadings,
  BctbRiskLevel,
  ResearchBctbModelInputs,
  ResearchBctbPrediction,
  ResearchShapContribution,
  WeatherMetrics,
} from "../types/bctb";
import { assessBctbRisk } from "./bctbRiskEngine";

const MODEL_STATUS = "RESEARCH_ONLY_SYNTHETIC_LABELS" as const;

function countInputs(inputs: Record<string, unknown>): number {
  const count = Object.values(inputs).filter(
    (value) => value !== null && value !== undefined && value !== "",
  ).length;
  return Math.max(7, Math.min(34, count));
}

function buildProbabilities(
  risk: BctbRiskLevel,
  score: number,
): Record<BctbRiskLevel, number> {
  const base: Record<BctbRiskLevel, [number, number, number]> = {
    LOW: [0.72, 0.2, 0.08],
    MODERATE: [0.2, 0.58, 0.22],
    HIGH: [0.08, 0.2, 0.72],
  };
  const [baseLow, , baseHigh] = base[risk];
  const shift = Math.max(-0.08, Math.min(0.08, (score - 50) / 500));
  const high = Math.min(0.95, Math.max(0.02, baseHigh + shift));
  const low = Math.min(0.95, Math.max(0.02, baseLow - shift / 2));
  const moderate = Math.max(0.01, 1 - low - high);
  const total = low + moderate + high;
  return {
    LOW: low / total,
    MODERATE: moderate / total,
    HIGH: high / total,
  };
}

function mapShap(
  contributions: Array<{
    feature: string;
    value: string;
    contribution: number;
    direction: "INCREASES_RISK" | "DECREASES_RISK";
  }>,
): ResearchShapContribution[] {
  if (!contributions.length) {
    return [{
      feature: "No elevated indicators",
      value: "None reported",
      contribution: 0,
      direction: "NEUTRAL",
    }];
  }
  return contributions.map((item) => ({
    feature: item.feature,
    value: item.value,
    contribution: item.contribution,
    direction: item.direction === "INCREASES_RISK"
      ? "SUPPORTS_PREDICTION"
      : "OPPOSES_PREDICTION",
  }));
}

export function buildWeatherSnapshot(
  readings?: BctbFieldReadings | null,
): WeatherMetrics | null {
  if (!readings) return null;
  const rainfall = readings.rainfall30dMm;
  const temperature = readings.meanTemperature30dC;
  const humidity = readings.meanRelativeHumidity30dPct;
  if (rainfall == null && temperature == null && humidity == null) return null;

  return {
    cumulativeRainfall7dMm: rainfall ?? 0,
    cumulativeRainfall14dMm: rainfall ?? 0,
    cumulativeRainfall30dMm: rainfall ?? 0,
    tempAvg7dC: temperature ?? 0,
    tempAvg30dC: temperature ?? 0,
    consecutiveDrySpellDays: 0,
    provider: "FARMER_RECORDED",
    retrievedAt: new Date().toISOString(),
    granularity: "SUBCOUNTY_FALLBACK",
  };
}

export function buildLocalResearchPrediction(
  assessment: Partial<BctbAssessmentInput>,
  weather?: WeatherMetrics | null,
  language: "en" | "lg" | "sw" | "nyn" = "en",
  inputCount?: number,
): ResearchBctbPrediction {
  const result = assessBctbRisk(assessment, weather, undefined, language);
  const shap = mapShap(result.shapContributions);
  const probabilities = buildProbabilities(result.riskLevel, result.internalScore);
  const steps = result.safeAdvisory.length ? result.safeAdvisory : [result.nextSteps];

  return {
    predicted_risk: result.riskLevel,
    class_probabilities: probabilities,
    shap_contributions: shap,
    top_shap_contributions: shap
      .slice()
      .sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution))
      .slice(0, 3),
    counterfactual: null,
    recommendations: undefined,
    actionable_steps: steps,
    model_name: "AgriSense Local Rule Engine",
    model_artifact: "bctbRiskEngine",
    model_status: MODEL_STATUS,
    input_count: inputCount ?? countInputs(assessment as Record<string, unknown>),
    input_total: 34,
    disclaimer: result.disclaimer,
  };
}

export function buildLocalResearchPredictionFromInputs(
  inputs: ResearchBctbModelInputs,
  language: "en" | "lg" | "sw" | "nyn" = "en",
): ResearchBctbPrediction {
  const assessment: Partial<BctbAssessmentInput> = {
    twigDiebackObserved: inputs.twig_dieback_observed === 1,
    pinSizedHoles: inputs.suspected_entry_holes_observed === 1,
    affectedTwigCount: inputs.affected_twig_count_reported,
    previousBctbHistory: inputs.previous_bctb_report === 1,
    increasingTwigDamage: inputs.increasing_twig_damage === null
      ? null
      : inputs.increasing_twig_damage === 1,
    yellowing: inputs.yellowing_observed === null ? null : inputs.yellowing_observed === 1,
    blackening: inputs.blackening_observed === null ? null : inputs.blackening_observed === 1,
    wilting: inputs.wilting_observed === null ? null : inputs.wilting_observed === 1,
    drying: inputs.drying_observed === null ? null : inputs.drying_observed === 1,
    hasAlternativeHosts: inputs.nearby_host_vegetation === null
      ? null
      : inputs.nearby_host_vegetation === 1,
    unmanagedSuckersPresent: inputs.unmanaged_suckers_present === null
      ? null
      : inputs.unmanaged_suckers_present === 1,
    recentDeSuckering: inputs.recent_desuckering_done === null
      ? null
      : inputs.recent_desuckering_done === 1,
    affectedTwigRemoval: inputs.affected_twig_removal === "consistent"
      ? "CONSISTENT"
      : inputs.affected_twig_removal === "inconsistent"
        ? "INCONSISTENT"
        : inputs.affected_twig_removal === "none"
          ? "NONE"
          : null,
    coffeeAge: inputs.coffee_age === "young_under_3"
      ? "YOUNG_UNDER_3"
      : inputs.coffee_age === "mature_3_to_15"
        ? "MATURE_3_TO_15"
        : inputs.coffee_age === "old_over_15"
          ? "OLD_OVER_15"
          : null,
    shadeCanopy: inputs.shade_canopy === "dense"
      ? "DENSE"
      : inputs.shade_canopy === "moderate"
        ? "MODERATE"
        : inputs.shade_canopy === "open_full_sun"
          ? "OPEN_FULL_SUN"
          : null,
    coffeeVariety: inputs.coffee_variety === "robusta_traditional"
      ? "ROBUSTA_TRADITIONAL"
      : inputs.coffee_variety === "robusta_cwdr_clonal"
        ? "ROBUSTA_CWDr_CLONAL"
        : inputs.coffee_variety === "robusta_mixed"
          ? "ROBUSTA_MIXED"
          : null,
    farmSanitation: inputs.farm_sanitation === "good"
      ? "GOOD"
      : inputs.farm_sanitation === "moderate"
        ? "FAIR"
        : "POOR",
    pruningFrequency: inputs.pruning_frequency,
    recentPruning: inputs.recent_pruning_done === 1,
    locationConsent: false,
    followUpConsent: false,
  };

  return buildLocalResearchPrediction(
    assessment,
    null,
    language,
    countInputs(inputs as unknown as Record<string, unknown>),
  );
}