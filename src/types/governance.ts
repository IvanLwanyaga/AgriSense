export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  task: "IRRIGATION_SCHEDULING" | "CROP_RECOMMENDATION" | "PEST_DISEASE_DETECTION" | "ANOMALY_DETECTION";
  algorithm: string; // e.g. "XGBoost Classifier + SHAP TreeExplainer"
  trainedOnDataset: string;
  evaluationMetrics: {
    accuracy?: number;
    f1Score?: number;
    mae?: number; // Mean absolute error
    precision?: number;
    recall?: number;
  };
  lastRetrainedDate: string;
  activeInProduction: boolean;
  notes: string;
}

export interface InferenceAuditRecord {
  id: string;
  timestamp: string;
  modelId: string;
  modelVersion: string;
  farmId: string;
  fieldId?: string;
  inputTelemetrySnapshot: Record<string, number | string | boolean>;
  outputPrediction: string;
  confidenceScore: number;
  topShapFeatures: Array<{ feature: string; shapValue: number }>;
  limeFidelityR2: number;
  advisoryTextGenerated: string;
}

