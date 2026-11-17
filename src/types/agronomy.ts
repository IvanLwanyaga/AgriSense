export type UgandaAgroZone =
  | "LAKE_VICTORIA_CRESCENT"
  | "NORTHERN_MOIST_FARMLANDS"
  | "WESTERN_HIGHLANDS"
  | "SOUTH_WESTERN_HIGHLANDS"
  | "EASTERN_SAVANNAH"
  | "KARAMOJA_SEMI_ARID";

export type UgandanCropId =
  | "MAIZE_LONGE"
  | "MATOOKE_BANANA"
  | "COFFEE_ROBUSTA"
  | "COFFEE_ARABICA"
  | "BEANS_NABE"
  | "CASSAVA_NASE"
  | "SWEET_POTATOES"
  | "GROUNDNUTS"
  | "TOMATOES"
  | "SORGHUM";

export type SoilType =
  | "FERROSOL_RED_CLAY"
  | "SANDY_LOAM"
  | "VERTISOL_BLACK_COTTON"
  | "ALLUVIAL_LOAM"
  | "VOLCANIC_LOAM";

export type CropGrowthStage =
  | "LAND_PREPARATION"
  | "GERMINATION"
  | "VEGETATIVE"
  | "FLOWERING_TASSELING"
  | "YIELD_FORMATION"
  | "RIPENING_MATURITY"
  | "HARVEST";

export interface CropAgronomicProfile {
  id: UgandanCropId;
  commonName: string;
  localName?: string;
  variety: string;
  typicalSeason: "SEASON_A_BIMODAL" | "SEASON_B_BIMODAL" | "PERENNIAL" | "UNIMODAL_NORTH";
  durationDays: number;
  optimalSoilMoisture: {
    minimumPercentage: number;
    optimalPercentage: number;
    maximumPercentage: number;
  };
  temperatureRangeCelsius: {
    min: number;
    optimalMin: number;
    optimalMax: number;
    max: number;
  };
  soilPhRange: {
    min: number;
    optimalMin: number;
    optimalMax: number;
    max: number;
  };
  suitableSoils: SoilType[];
  suitableAgroZones: UgandaAgroZone[];
  waterRequirementMmPerSeason: number;
  diseaseRisks: Array<{
    name: string;
    triggerCondition: string;
    preventionAdvice: string;
  }>;
}

export interface UgandaDistrictInfo {
  name: string;
  region: "Central" | "Eastern" | "Northern" | "Western";
  zone: UgandaAgroZone;
  latitude: number;
  longitude: number;
  typicalSoil: SoilType;
  primaryCrops: UgandanCropId[];
}

