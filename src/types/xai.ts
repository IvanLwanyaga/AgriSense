export type FeatureImpactDirection = "INCREASES_PROBABILITY" | "DECREASES_PROBABILITY" | "NEUTRAL";

export interface ShapFeatureContribution {
  featureName: string;
  featureLabel: string; // Plain agricultural label, e.g. "Soil Moisture at Root Zone"
  observedValue: string | number;
  shapValue: number; // Marginal contribution to recommendation score
  relativeImportancePercentage: number; // 0 - 100%
  direction: FeatureImpactDirection;
  farmerExplanation: string; // e.g. "Current moisture (24%) is well below the 35% crop minimum"
}

export interface LimeLocalExplanation {
  intercept: number;
  localR2Score: number; // Surrogate fidelity (e.g. 0.88)
  featureWeights: Array<{
    feature: string;
    condition: string;
    weight: number;
    description: string;
  }>;
}

export interface ExplainableAiPayload {
  explanationMethod: "SHAP_AND_LIME" | "SHAP" | "LIME";
  baseValue: number; // Model expected output / bias
  predictedValue: number;
  confidenceScore: number; // 0.00 - 1.00
  topDrivers: ShapFeatureContribution[];
  shapSummary: {
    baseValue: number;
    features: ShapFeatureContribution[];
  };
  limeSummary: LimeLocalExplanation;
  farmerPlainLanguageSummary: string;
  technicalAuditorNotes: string;
}

