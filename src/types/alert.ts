export type AlertCategory =
  | "DROUGHT_RISK"
  | "WATERLOGGING_RISK"
  | "HEAT_STRESS"
  | "DISEASE_PEST_WINDOW"
  | "BCTB_SCREENING"
  | "UNUSUAL_ANOMALY"
  | "HARDWARE_CONNECTIVITY";

export type AlertSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface FarmAlert {
  id: string;
  farmId: string;
  fieldId?: string;
  fieldName?: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  suggestedMitigation: string;
  detectedAt: string;
  resolvedAt?: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  sourceId?: string;
}

