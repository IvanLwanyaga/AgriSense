import type { CropGrowthStage, SoilType, UgandanCropId } from "./agronomy";

export interface FarmLocation {
  latitude: number;
  longitude: number;
  address?: string;
  district: string;
  subCounty?: string;
  region?: string;
  country: string;
  granularity?: "EXACT" | "SUBCOUNTY_CENTROID";
}

export interface FarmBoundaryPoint {
  latitude: number;
  longitude: number;
}

export interface FarmPassportAuditEntry {
  action: "BOUNDARY_RECORDED";
  actorUid: string;
  recordedAt: string;
  pointCount: number;
  areaHectares: number;
  source: "GPS_OR_MANUAL";
}

export interface Farm {
  id: string;
  farmerId: string; // The owner / farmer's UID
  organizationId: string | null; // null for standalone smallholders
  name: string;
  description: string;
  location: FarmLocation;
  boundary?: FarmBoundaryPoint[];
  boundaryAreaHectares?: number;
  passportAudit?: FarmPassportAuditEntry[];
  passportUpdatedAt?: string;
  district: string;
  subCounty?: string;
  parish?: string;
  village?: string;
  area?: number; // In hectares / acres
  coffeeAcreage?: number;
  treeCount?: number;
  topography?: "HILLSIDE" | "VALLEY" | "FLAT";
  status: "ACTIVE" | "INACTIVE";
  primaryCrop?: UgandanCropId | "ROBUSTA_COFFEE";
  coffeeVariety?: "ROBUSTA_TRADITIONAL" | "ROBUSTA_CWDr_CLONAL" | "ROBUSTA_MIXED" | "ARABICA";
  coffeeAge?: "YOUNG_UNDER_3" | "MATURE_3_TO_15" | "OLD_OVER_15";
  shadeCanopy?: "DENSE" | "MODERATE" | "OPEN_FULL_SUN";
  shadePercentage?: "NONE" | "LOW_UNDER_20" | "MEDIUM_20_TO_40" | "HEAVY_OVER_40";
  hasBctbHistory?: boolean;
  lastSanitationDate?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface Field {
  id: string;
  farmId: string;
  farmerId: string;
  organizationId: string | null;
  name: string;
  area: number; // In hectares
  soilType: SoilType;
  cropId: UgandanCropId | null;
  cropVariety?: string;
  plantingDate?: string; // ISO date string
  growthStage?: CropGrowthStage;
  irrigationMethod?: "DRIP" | "SPRINKLER" | "RAIN_FED" | "MANUAL_BUCKET" | "FURROW";
  moistureThreshold: {
    minimum: number;
    optimal: number;
    maximum: number;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  status: "ACTIVE" | "INACTIVE";
  createdAt: unknown;
  updatedAt: unknown;
}