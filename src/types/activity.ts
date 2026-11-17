export type FarmActivityType =
  | "PLANTING"
  | "IRRIGATION"
  | "FERTILIZER_APPLICATION"
  | "WEEDING"
  | "PEST_DISEASE_SPRAYING"
  | "HARVESTING"
  | "PRUNING"
  | "FIELD_SCOUTING"
  | "SOIL_PREPARATION";

export interface FarmActivity {
  id: string;
  farmId: string;
  fieldId?: string;
  farmerId: string;
  activityType: FarmActivityType;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  notes?: string;
  
  // Specific input attributes
  inputName?: string; // e.g. "DAP Fertilizer", "Urea", "NABE 15 Seed", "Rocket 44EC"
  quantityApplied?: number;
  quantityUnit?: string; // e.g. "kg", "litres", "bags"
  costUgx?: number; // Ugandan Shillings
  labourCount?: number;
  
  createdAt: string;
}

