export type FollowUpStatus =
  | "new"
  | "reviewed"
  | "contacted"
  | "visited"
  | "resolved"
  | "referred";

export type VerifiedObservationStatus =
  | "pending"
  | "confirmed_bctb"
  | "unconfirmed"
  | "not_confirmed"
  | "other_pest_or_condition";

export interface StructuredInspection {
  treesInspected: number;
  branchesInfested: number;
  entryHolesObserved: boolean;
  shadePercentage: number;
  sanitationRating: "GOOD" | "FAIR" | "POOR";
  interviewNotes: string;
  recommendedCulturalActions: string[];
  photos: string[];
  inspectedAt: string;
  inspectedBy: string;
  officerId: string;
}

export interface ExtensionNote {
  id: string;
  officerId: string;
  officerName: string;
  text: string;
  createdAt: string;
}

export interface FollowUpTimelineEvent {
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface FollowUpCase {
  id: string;
  assessmentId: string;
  farmId: string;
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
  district: string;
  subCounty: string;
  riskLevel: "HIGH" | "MODERATE" | "LOW";
  status: FollowUpStatus;
  verifiedObservation: VerifiedObservationStatus;
  followUpConsent: boolean;
  locationConsent: boolean;
  photoUrl?: string;
  triggeredFactors: string[];
  notes: ExtensionNote[];
  timeline: FollowUpTimelineEvent[];
  inspection?: StructuredInspection;
  createdAt: string;
  updatedAt: string;
}

