import type { ExplainableAiPayload } from "./xai";
import type { TelemetryQuality } from "./iot";

export type RecommendationType =
  | "IRRIGATION_TIMING"
  | "CROP_SUITABILITY"
  | "DISEASE_PEST_RISK"
  | "PLANTING_WINDOW"
  | "SOIL_MANAGEMENT";

export type RecommendationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RecommendationStatus = "ACTIVE" | "APPLIED" | "DISMISSED" | "EXPIRED";

export interface AgriculturalRecommendation {
  id: string;
  farmId: string;
  fieldId?: string;
  fieldName?: string;
  cropName?: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  
  // The core tripartite structure from the specification:
  // "What is happening on my farm, why is it happening, and what should I do about it?"
  whatIsHappening: string;
  whyItIsHappening: string;
  suggestedAction: string; // Framed advisably: "Conditions suggest...", "Consider..."
  
  relevantConditionsSummary: string[];
  confidenceScore: number; // 0.00 to 1.00
  
  // Explainability & Governance Traceability
  explainability: ExplainableAiPayload;
  modelVersion: string;
  dataQualityStatus: TelemetryQuality;
  
  generatedAt: string; // ISO string
  expiresAt: string;
  status: RecommendationStatus;
}

