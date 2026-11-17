export type BctbRiskLevel = "LOW" | "MODERATE" | "HIGH";
export type DataQuality = "GOOD" | "LIMITED" | "INSUFFICIENT";
export type PruningFrequency = "regular" | "occasional" | "rare";

export interface ResearchBctbModelInputs {
  twig_dieback_observed: 0 | 1;
  suspected_entry_holes_observed: 0 | 1;
  affected_twig_count_reported: number;
  previous_bctb_report: 0 | 1;
  farm_sanitation: "good" | "moderate" | "poor";
  pruning_frequency: PruningFrequency;
  recent_pruning_done: 0 | 1;
  increasing_twig_damage: 0 | 1 | null;
  yellowing_observed: 0 | 1 | null;
  blackening_observed: 0 | 1 | null;
  wilting_observed: 0 | 1 | null;
  drying_observed: 0 | 1 | null;
  nearby_host_vegetation: 0 | 1 | null;
  unmanaged_suckers_present: 0 | 1 | null;
  recent_desuckering_done: 0 | 1 | null;
  affected_twig_removal: "consistent" | "inconsistent" | "none" | null;
  coffee_age: "young_under_3" | "mature_3_to_15" | "old_over_15" | null;
  shade_canopy: "dense" | "moderate" | "open_full_sun" | null;
  coffee_variety: "robusta_traditional" | "robusta_cwdr_clonal" | "robusta_mixed" | null;
  affected_twig_diameter_mm: number | null;
  rainfall_30d_mm: number | null;
  mean_temperature_30d_c: number | null;
  mean_relative_humidity_30d_pct: number | null;
  canopy_cover_pct: number | null;
  shade_tree_count: number | null;
  distance_to_woodland_m: number | null;
  drought_stress_observed: 0 | 1 | null;
  recently_transplanted: 0 | 1 | null;
  infested_twigs_removed: 0 | 1 | null;
  coffee_trees_inspected: number | null;
  trees_with_possible_signs: number | null;
  plot_area_ha: number | null;
  shade_tree_species: string | null;
  inspection_month: number | null;
}

export interface ResearchShapContribution {
  feature: string;
  value: string;
  contribution: number;
  direction: "SUPPORTS_PREDICTION" | "OPPOSES_PREDICTION" | "NEUTRAL";
}

export interface ResearchRecommendationItem {
  code: string;
  priority: "PROMPT" | "ROUTINE";
  title: string;
  actions: string[];
  requires_field_confirmation: boolean;
  evidence_feature: string;
}

export interface StructuredResearchRecommendations {
  basis: string;
  predicted_class: BctbRiskLevel;
  top_features: Array<ResearchShapContribution & { interpretation: string }>;
  items: ResearchRecommendationItem[];
  extension_referral: { recommended: boolean; reason: string };
  safety_note: string;
}

export interface ResearchBctbPrediction {
  predicted_risk: BctbRiskLevel;
  class_probabilities: Record<BctbRiskLevel, number>;
  shap_contributions: ResearchShapContribution[];
  top_shap_contributions?: ResearchShapContribution[];
  counterfactual?: {
    target_risk: BctbRiskLevel;
    changes: Record<string, string | number | boolean>;
    change_details?: Array<{ feature: string; from: string | number | boolean; to: string | number | boolean }>;
    changed_feature_count?: number;
    target_class_score?: number | null;
    target_class_score_label?: string;
    status?: string;
    method: string;
    disclaimer: string;
  } | null;
  recommendations?: StructuredResearchRecommendations;
  actionable_steps: string[];
  model_name: string;
  model_artifact: string;
  model_status: "RESEARCH_ONLY_SYNTHETIC_LABELS";
  input_count: number;
  input_total: number;
  disclaimer: string;
}

export interface WeatherMetrics {
  cumulativeRainfall7dMm: number;
  cumulativeRainfall14dMm: number;
  cumulativeRainfall30dMm: number;
  tempAvg7dC: number;
  tempAvg30dC: number;
  consecutiveDrySpellDays: number;
  provider: string;
  retrievedAt: string;
  granularity: "EXACT_COORDINATES" | "SUBCOUNTY_FALLBACK" | "UNAVAILABLE";
}

/** Optional farm measurements saved with a local draft, not used by the current model. */
export interface BctbFieldReadings {
  inspectionDate: string;
  plotAreaHa: number | null;
  coffeeTreesInspected: number | null;
  treesWithPossibleSigns: number | null;
  affectedTwigDiameterMm: number | null;
  rainfall30dMm: number | null;
  meanTemperature30dC: number | null;
  meanRelativeHumidity30dPct: number | null;
  canopyCoverPct: number | null;
  shadeTreeCount: number | null;
  distanceToWoodlandM: number | null;
  nearbyHostVegetation: boolean | null;
  droughtStressObserved: boolean | null;
  recentlyTransplanted: boolean | null;
  infestedTwigsRemoved: boolean | null;
  shadeTreeSpecies: string;
  measurementNotes: string;
}

export interface BctbAssessmentInput {
  farmId?: string;
  farmerId?: string;
  district?: string;
  subCounty?: string;
  coffeeVariety?: "ROBUSTA_TRADITIONAL" | "ROBUSTA_CWDr_CLONAL" | "ROBUSTA_MIXED" | null;
  coffeeAge?: "YOUNG_UNDER_3" | "MATURE_3_TO_15" | "OLD_OVER_15" | null;
  shadeCanopy?: "DENSE" | "MODERATE" | "OPEN_FULL_SUN" | null;
  hasAlternativeHosts?: boolean | null;
  unmanagedSuckersPresent?: boolean | null;
  previousBctbHistory: boolean | null;
  increasingTwigDamage: boolean | null;
  twigDiebackObserved?: boolean | null;
  affectedTwigCount: number | null;
  yellowing: boolean | null;
  pinSizedHoles: boolean | null;
  blackening: boolean | null;
  wilting: boolean | null;
  drying: boolean | null;
  recentPruning: boolean | null;
  recentDeSuckering: boolean | null;
  affectedTwigRemoval: "CONSISTENT" | "INCONSISTENT" | "NONE" | null;
  farmSanitation: "GOOD" | "FAIR" | "POOR" | null;
  pruningFrequency?: PruningFrequency | null;
  optionalPhotoUrl?: string | null;
  locationConsent: boolean;
  followUpConsent: boolean;
  farmerNotes?: string;
  fieldReadings?: BctbFieldReadings;
}

export interface ShapContribution {
  feature: string;
  value: string;
  contribution: number;
  direction: "INCREASES_RISK" | "DECREASES_RISK";
}

export interface BctbRiskResult {
  id?: string;
  farmId?: string;
  farmerId?: string;
  riskLevel: BctbRiskLevel;
  internalScore: number;
  triggeredFactors: string[];
  explanation: string;
  nextSteps: string;
  advisoryCategory: "MONITOR" | "INSPECT" | "REQUEST_VERIFICATION";
  safeAdvisory: string[];
  disclaimer: string;
  dataQuality: DataQuality;
  weatherAvailable: boolean;
  weatherSnapshot?: WeatherMetrics | null;
  engineType: "EXPERT_RULES";
  engineVersion: string;
  ruleConfigVersion: string;
  validationStatus: "pending_validation_by_coffee_agronomist" | "validated_by_agronomist";
  shapContributions: ShapContribution[];
  followUpConsent: boolean;
  locationConsent: boolean;
  optionalPhotoUrl?: string | null;
  createdAt: string;
}
