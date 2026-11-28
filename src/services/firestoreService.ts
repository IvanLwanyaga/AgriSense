import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  deleteDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";
import type { Farm, FarmBoundaryPoint, FarmPassportAuditEntry, Field } from "../types/farm";
import type { SoilType, UgandanCropId } from "../types/agronomy";
import type { BctbRiskResult } from "../types/bctb";

const LOCAL_FARMS_KEY = "agrisense_cached_farms_v2";
const LOCAL_FIELDS_KEY = "agrisense_cached_fields_v2";

function getCachedFarms(userId: string): Farm[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_FARMS_KEY}_${userId}`);
    if (!raw) return [];
    return JSON.parse(raw) as Farm[];
  } catch {
    return [];
  }
}

function saveCachedFarms(farms: Farm[], userId: string): void {
  try {
    localStorage.setItem(`${LOCAL_FARMS_KEY}_${userId}`, JSON.stringify(farms));
  } catch (err) {
    console.error("Failed saving farms to local cache:", err);
  }
}

function getCachedFields(userId: string): Field[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_FIELDS_KEY}_${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCachedFields(fields: Field[], userId: string): void {
  try {
    localStorage.setItem(`${LOCAL_FIELDS_KEY}_${userId}`, JSON.stringify(fields));
  } catch (err) {
    console.error("Failed saving fields to local cache:", err);
  }
}

function isNetworkUnavailable(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return ["unavailable", "deadline-exceeded", "network-request-failed"].includes(
    String((error as { code: unknown }).code),
  );
}

/**
 * Get all farms accessible to the user:
 * Either by organizationId (cooperative members) or farmerId (standalone smallholders).
 */
export async function getFarms(
  userId?: string,
  organizationId?: string | null
): Promise<Farm[]> {
  if (!userId && !organizationId) return [];
  if (!userId || userId !== auth.currentUser?.uid) {
    throw new Error("Sign in to load your farm records.");
  }

  try {
    const farmQuery = organizationId
      ? query(collection(db, "farms"), where("organizationId", "==", organizationId))
      : query(collection(db, "farms"), where("farmerId", "==", userId));
    const snapshot = await getDocs(farmQuery);
    const farms = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Farm[];
    saveCachedFarms(farms, userId);
    return farms;
  } catch (error) {
    if (isNetworkUnavailable(error)) {
      return getCachedFarms(userId);
    }
    console.error("Farm records could not be loaded from Firestore.", error);
    throw new Error("Farm records could not be loaded. Check your connection and account permissions.", { cause: error });
  }
}

/** Read-only farm directory for an officer's assigned district. Firestore rules
 * enforce the officer's district assignment on this query. */
export async function getDistrictFarms(district: string): Promise<Farm[]> {
  if (!district || !auth.currentUser?.uid) return [];
  try {
    const snapshot = await getDocs(query(collection(db, "farms"), where("district", "==", district)));
    return snapshot.docs.map((farmDoc) => ({ id: farmDoc.id, ...farmDoc.data() }) as Farm);
  } catch (error) {
    console.error("District farm directory could not be loaded.", error);
    throw new Error("Farm records for your assigned district could not be loaded. Check your connection and account permissions.", { cause: error });
  }
}

export async function getOrganizationScreenings(organizationId: string): Promise<BctbRiskResult[]> {
  const userId = auth.currentUser?.uid;
  if (!userId || !organizationId) {
    throw new Error("Sign in with an organization account to load cooperative screening data.");
  }
  try {
    const snapshot = await getDocs(query(
      collection(db, "riskResults"),
      where("organizationId", "==", organizationId)
    ));
    return snapshot.docs.map((item) => {
      const data = item.data();
      const createdAt = data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : typeof data.createdAt === "string"
          ? data.createdAt
          : "";
      return { ...data, id: item.id, createdAt } as BctbRiskResult;
    }).sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  } catch (error) {
    console.error("Cooperative screening records could not be loaded.", error);
    throw new Error("Cooperative screening data could not be loaded. Check your connection and organization permissions.", {
      cause: error,
    });
  }
}

export async function createFarm(
  farmerId: string,
  organizationId: string | null,
  name: string,
  description: string,
  latitude: number,
  longitude: number,
  district: string,
  area?: number,
  primaryCrop?: UgandanCropId | "ROBUSTA_COFFEE",
  subCounty?: string,
  coffeeVariety?: "ROBUSTA_TRADITIONAL" | "ROBUSTA_CWDr_CLONAL" | "ROBUSTA_MIXED" | "ARABICA",
  coffeeAge?: "YOUNG_UNDER_3" | "MATURE_3_TO_15" | "OLD_OVER_15",
  shadeCanopy?: "DENSE" | "MODERATE" | "OPEN_FULL_SUN",
  hasBctbHistory?: boolean,
  additional?: {
    parish?: string;
    village?: string;
    coffeeAcreage?: number;
    treeCount?: number;
    shadePercentage?: "NONE" | "LOW_UNDER_20" | "MEDIUM_20_TO_40" | "HEAVY_OVER_40";
    topography?: "HILLSIDE" | "VALLEY" | "FLAT";
    coordinateSource?: "GOOGLE_PLACES" | "GPS" | "DISTRICT_CENTROID";
  }
): Promise<Farm> {
  const granularity: NonNullable<Farm["location"]["granularity"]> =
    additional?.coordinateSource === "GOOGLE_PLACES" && !additional?.village
      ? "SUBCOUNTY_CENTROID"
      : "EXACT";
  const farmData = {
    farmerId,
    organizationId: organizationId || null,
    name,
    description,
    location: {
      latitude,
      longitude,
      district,
      subCounty,
      country: "Uganda",
      granularity,
      ...(additional?.coordinateSource === "GOOGLE_PLACES" || additional?.coordinateSource === "GPS"
        ? { coordinateSource: additional.coordinateSource }
        : {}),
    },
    district,
    subCounty,
    parish: additional?.parish,
    village: additional?.village,
    country: "Uganda",
    area: area ?? undefined,
    coffeeAcreage: additional?.coffeeAcreage ?? area,
    treeCount: additional?.treeCount,
    topography: additional?.topography || "FLAT",
    status: "ACTIVE" as const,
    primaryCrop: primaryCrop || "ROBUSTA_COFFEE",
    coffeeVariety: coffeeVariety || "ROBUSTA_CWDr_CLONAL",
    coffeeAge: coffeeAge || "MATURE_3_TO_15",
    shadeCanopy: shadeCanopy || "MODERATE",
    shadePercentage: additional?.shadePercentage || "MEDIUM_20_TO_40",
    hasBctbHistory: hasBctbHistory ?? false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const farmRef = doc(collection(db, "farms"));
    const createdFarm: Farm = { id: farmRef.id, ...farmData };
    const write = setDoc(farmRef, {
      ...farmData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      saveCachedFarms([createdFarm, ...getCachedFarms(farmerId)], farmerId);
      void write.catch((err) => console.error("Queued farm could not sync after reconnecting.", err));
      return createdFarm;
    }
    await write;
    saveCachedFarms([createdFarm, ...getCachedFarms(farmerId)], farmerId);
    return createdFarm;
  } catch (err) {
    console.error("Farm creation failed in Firestore.", err);
    throw new Error("Farm was not saved to the shared system. Check your connection and try again.", { cause: err });
  }
}

export async function deleteFarm(farmId: string): Promise<void> {
  try {
    const write = deleteDoc(doc(db, "farms", farmId));
    const userId = auth.currentUser?.uid;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      if (userId) saveCachedFarms(getCachedFarms(userId).filter((farm) => farm.id !== farmId), userId);
      void write.catch((err) => console.error("Queued farm deletion could not sync after reconnecting.", err));
      return;
    }
    await write;
  } catch (err) {
    console.error("Farm deletion failed in Firestore.", err);
    throw new Error("Farm was not deleted from the shared system. Check your connection and try again.", { cause: err });
  }
  const userId = auth.currentUser?.uid;
  if (userId) {
    const cached = getCachedFarms(userId).filter((farm) => farm.id !== farmId);
    saveCachedFarms(cached, userId);
  }
}

export async function saveFarmBoundary(
  farm: Farm,
  points: FarmBoundaryPoint[],
  areaHectares: number
): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId || userId !== farm.farmerId) {
    throw new Error("Only the registered farm owner can save this passport boundary.");
  }
  if (points.length < 3 || points.length > 500) {
    throw new Error("A farm boundary must contain between 3 and 500 GPS points.");
  }
  if (points.some((point) =>
    !Number.isFinite(point.latitude)
    || point.latitude < -90
    || point.latitude > 90
    || !Number.isFinite(point.longitude)
    || point.longitude < -180
    || point.longitude > 180
  )) {
    throw new Error("Every farm boundary point must contain valid latitude and longitude coordinates.");
  }
  if (!Number.isFinite(areaHectares) || areaHectares <= 0) {
    throw new Error("The measured farm boundary area must be greater than zero.");
  }

  const recordedAt = new Date().toISOString();
  const auditEntry: FarmPassportAuditEntry = {
    action: "BOUNDARY_RECORDED",
    actorUid: userId,
    recordedAt,
    pointCount: points.length,
    areaHectares,
    source: "GPS_OR_MANUAL",
  };

  try {
    const write = updateDoc(doc(db, "farms", farm.id), {
      boundary: points,
      passportAudit: arrayUnion(auditEntry),
      passportUpdatedAt: serverTimestamp(),
      boundaryAreaHectares: areaHectares,
    });
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      void write.catch((error) => console.error("Queued farm boundary could not sync after reconnecting.", error));
      return;
    }
    await write;
  } catch (error) {
    console.error("Farm passport boundary could not be saved.", error);
    throw new Error("Farm boundary was not saved. Check your connection and account permissions.", { cause: error });
  }
}

export async function setCurrentUserSmsConsent(consent: boolean): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("Sign in to update SMS notification consent.");
  try {
    const write = updateDoc(doc(db, "users", userId), {
      smsConsent: consent,
      updatedAt: serverTimestamp(),
    });
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      void write.catch((error) => console.error("Queued SMS consent could not sync after reconnecting.", error));
      return;
    }
    await write;
  } catch (error) {
    console.error("SMS notification consent could not be updated.", error);
    throw new Error("Your SMS consent preference could not be saved.", { cause: error });
  }
}

/**
 * Get all fields for a specific farm
 */
export async function getFields(farmId: string): Promise<Field[]> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("Sign in to load field records.");
  try {
    const q = query(collection(db, "fields"), where("farmId", "==", farmId));
    const snapshot = await getDocs(q);
    const fields = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Field[];
    saveCachedFields(fields, userId);
    return fields;
  } catch (err) {
    if (isNetworkUnavailable(err)) {
      return getCachedFields(userId).filter((field) => field.farmId === farmId);
    }
    console.error("Field records could not be loaded from Firestore.", err);
    throw new Error("Field records could not be loaded. Check your connection and account permissions.", { cause: err });
  }
}

export async function createField(
  farmId: string,
  farmerId: string,
  organizationId: string | null,
  name: string,
  area: number,
  soilType: SoilType,
  cropId: UgandanCropId,
  cropVariety: string,
  plantingDate: string,
  irrigationMethod: "DRIP" | "SPRINKLER" | "RAIN_FED" | "MANUAL_BUCKET" | "FURROW"
): Promise<Field> {
  const fieldData: Omit<Field, "id"> = {
    farmId,
    farmerId,
    organizationId: organizationId || null,
    name,
    area,
    soilType,
    cropId,
    cropVariety,
    plantingDate,
    growthStage: "VEGETATIVE",
    irrigationMethod,
    moistureThreshold: {
      minimum: 28,
      optimal: 55,
      maximum: 85,
    },
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const fieldRef = doc(collection(db, "fields"));
    const newField: Field = { id: fieldRef.id, ...fieldData };
    const write = setDoc(fieldRef, {
      ...fieldData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      saveCachedFields([newField, ...getCachedFields(farmerId)], farmerId);
      void write.catch((err) => console.error("Queued field could not sync after reconnecting.", err));
      return newField;
    }
    await write;
    saveCachedFields([newField, ...getCachedFields(farmerId)], farmerId);
    return newField;
  } catch (err) {
    console.error("Field creation failed in Firestore.", err);
    throw new Error("Field was not saved to the shared system. Check your connection and try again.", { cause: err });
  }
}
