import type { InferenceAuditRecord, ModelMetadata } from "../types/governance";

const AUDIT_STORAGE_KEY = "agrisense_inference_audit_logs";
const MODELS_STORAGE_KEY = "agrisense_models_registry";

const INITIAL_MODELS: ModelMetadata[] = [
  {
    id: "AgriSense-IrrigXGB-v1.4.2",
    name: "Root-Zone Irrigation Scheduler",
    version: "v1.4.2",
    task: "IRRIGATION_SCHEDULING",
    algorithm: "Extreme Gradient Boosting (XGBoost) + TreeSHAP",
    trainedOnDataset: "NARO Kawanda & Namulonge Agricultural Station (2020-2025)",
    evaluationMetrics: {
      accuracy: 0.932,
      f1Score: 0.918,
      mae: 1.84, // mm moisture discrepancy
      precision: 0.925,
      recall: 0.912,
    },
    lastRetrainedDate: "2026-06-14",
    activeInProduction: true,
    notes: "Trained on bimodal rainfall transitions across Lake Victoria Crescent and Northern Farmlands.",
  },
  {
    id: "AgriSense-PathoRisk-v1.1.0",
    name: "Microclimate Foliar Pathogen Predictor",
    version: "v1.1.0",
    task: "PEST_DISEASE_DETECTION",
    algorithm: "Random Forest Classifier + LIME Local Surrogates",
    trainedOnDataset: "Uganda Coffee Development Authority (UCDA) Rust & Blight Observations",
    evaluationMetrics: {
      accuracy: 0.894,
      f1Score: 0.887,
      precision: 0.902,
      recall: 0.874,
    },
    lastRetrainedDate: "2026-05-20",
    activeInProduction: true,
    notes: "Predicts high-probability incubation windows for Coffee Leaf Rust, Sigatoka, and Maize Blight.",
  },
  {
    id: "AgriSense-CropSuit-v2.0.1",
    name: "Agro-Ecological Crop Suitability Classifier",
    version: "v2.0.1",
    task: "CROP_RECOMMENDATION",
    algorithm: "Multi-Layer Perceptron (MLP) + Kernel SHAP",
    trainedOnDataset: "Ministry of Agriculture (MAAIF) Agro-ecological Soil & Climate Census",
    evaluationMetrics: {
      accuracy: 0.948,
      f1Score: 0.941,
    },
    lastRetrainedDate: "2026-07-02",
    activeInProduction: true,
    notes: "Ranks crop cultivars based on district soil pH, elevation, texture, and rainfall seasonality.",
  },
];

export function getRegisteredModels(): ModelMetadata[] {
  try {
    const raw = localStorage.getItem(MODELS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MODELS_STORAGE_KEY, JSON.stringify(INITIAL_MODELS));
      return INITIAL_MODELS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MODELS;
  }
}

export function logInferenceEvent(
  event: Omit<InferenceAuditRecord, "id" | "timestamp">
): InferenceAuditRecord {
  const auditRecord: InferenceAuditRecord = {
    ...event,
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    const existing: InferenceAuditRecord[] = raw ? JSON.parse(raw) : [];
    existing.unshift(auditRecord);
    // Keep 150 most recent inference events in audit ledger
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(existing.slice(0, 150)));
  } catch (err) {
    console.error("Error writing inference audit log:", err);
  }

  return auditRecord;
}

export function getInferenceAuditLogs(limitCount = 50): InferenceAuditRecord[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: InferenceAuditRecord[] = JSON.parse(raw);
    return parsed.slice(0, limitCount);
  } catch {
    return [];
  }
}

