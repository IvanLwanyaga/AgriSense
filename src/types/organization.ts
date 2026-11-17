export interface Organization {
  id: string;
  name: string;
  registrationNumber: string;
  district: string;
  subCounties: string[];
  contactEmail: string;
  contactPhone: string;
  tier: "ORGANISATION";
  status: "ACTIVE" | "INACTIVE";
  adminUid: string;
  maxFarmers: number;
  totalFarmers: number;
  totalFarms: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  role: "FARMER" | "AGRICULTURAL_OFFICER" | "FARM_MANAGER" | "ORG_ADMIN";
  assignedDistrict?: string;
  assignedSubCounty?: string;
  joinedAt: string;
}
