import {
  deleteDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";
import { authenticatedFetch } from "./authenticatedFetch";

export const COFFEE_PRICE_PRODUCTS = [
  { id: "robustaKiboko", label: "Robusta Kiboko (Dry Cherry)" },
  { id: "robustaFaq", label: "Robusta FAQ" },
  { id: "arabicaParchment", label: "Arabica Parchment" },
] as const;

export type CoffeePriceProductId = (typeof COFFEE_PRICE_PRODUCTS)[number]["id"];

export interface CoffeePriceRange {
  minimum: number;
  maximum: number;
}

export type CoffeePriceRates = Record<CoffeePriceProductId, CoffeePriceRange>;

export interface DailyCoffeePriceSnapshot {
  effectiveDate: string;
  source: string;
  rates: CoffeePriceRates;
  updatedAt: string;
  updatedBy: string;
}

export type CoffeePriceHistoryPoint = DailyCoffeePriceSnapshot;

export interface DailyCoffeePriceInput {
  effectiveDate: string;
  source: string;
  rates: CoffeePriceRates;
}

export interface DailyCoffeePriceFeed {
  active: DailyCoffeePriceSnapshot | null;
  automatic: DailyCoffeePriceSnapshot | null;
  adminOverride: DailyCoffeePriceSnapshot | null;
}

const ADMIN_PRICE_DOCUMENT = doc(db, "marketPrices", "uganda-coffee");
const AUTOMATIC_PRICE_DOCUMENT = doc(db, "marketPrices", "uganda-coffee-auto");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function parseRate(value: unknown): CoffeePriceRange | null {
  if (!isRecord(value)) return null;
  const minimum = value.minimum;
  const maximum = value.maximum;
  if (
    typeof minimum !== "number"
    || !Number.isFinite(minimum)
    || typeof maximum !== "number"
    || !Number.isFinite(maximum)
    || minimum < 0
    || maximum < minimum
  ) {
    return null;
  }
  return { minimum, maximum };
}

function parseUpdatedAt(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return value;
  return null;
}

function parseSnapshot(value: unknown): DailyCoffeePriceSnapshot {
  if (!isRecord(value) || !isRecord(value.rates)) {
    throw new Error("The published coffee price bulletin has an invalid format.");
  }

  const robustaKiboko = parseRate(value.rates.robustaKiboko);
  const robustaFaq = parseRate(value.rates.robustaFaq);
  const arabicaParchment = parseRate(value.rates.arabicaParchment);
  if (!robustaKiboko || !robustaFaq || !arabicaParchment) {
    throw new Error("A published coffee price range is invalid or missing.");
  }
  const rates: CoffeePriceRates = { robustaKiboko, robustaFaq, arabicaParchment };

  const updatedAt = parseUpdatedAt(value.updatedAt);
  if (
    typeof value.effectiveDate !== "string"
    || !isValidDate(value.effectiveDate)
    || typeof value.source !== "string"
    || !value.source.trim()
    || !updatedAt
    || typeof value.updatedBy !== "string"
    || !value.updatedBy
  ) {
    throw new Error("The published coffee price bulletin is incomplete.");
  }

  return {
    effectiveDate: value.effectiveDate,
    source: value.source,
    rates,
    updatedAt,
    updatedBy: value.updatedBy,
  };
}

export function subscribeToDailyCoffeePrices(
  onUpdate: (feed: DailyCoffeePriceFeed) => void,
  onError: (error: Error) => void
): () => void {
  let automatic: DailyCoffeePriceSnapshot | null = null;
  let adminOverride: DailyCoffeePriceSnapshot | null = null;
  let automaticLoaded = false;
  let adminLoaded = false;
  const publishFeed = () => {
    if (!automaticLoaded || !adminLoaded) return;
    onUpdate({ automatic, adminOverride, active: adminOverride || automatic });
  };
  const handleSnapshot = (
    kind: "automatic" | "admin",
    snapshot: { exists: () => boolean; data: () => unknown },
  ) => {
    try {
      const prices = snapshot.exists() ? parseSnapshot(snapshot.data()) : null;
      if (kind === "automatic") {
        automatic = prices;
        automaticLoaded = true;
      } else {
        adminOverride = prices;
        adminLoaded = true;
      }
      publishFeed();
    } catch (error) {
      console.error("The published coffee price bulletin could not be read.", error);
      onError(error instanceof Error ? error : new Error("The published coffee price bulletin is invalid."));
      if (kind === "automatic") {
        automatic = null;
        automaticLoaded = true;
      } else {
        adminOverride = null;
        adminLoaded = true;
      }
      publishFeed();
    }
  };
  const handleError = (kind: "automatic" | "admin", error: Error) => {
    console.error("Daily coffee prices could not be loaded from Firestore.", error);
    onError(new Error("Daily coffee prices could not be loaded. Check your connection and account permissions.", {
      cause: error,
    }));
    if (kind === "automatic") automaticLoaded = true;
    else adminLoaded = true;
    publishFeed();
  };
  const unsubscribeAdmin = onSnapshot(
    ADMIN_PRICE_DOCUMENT,
    (snapshot) => handleSnapshot("admin", snapshot),
    (error) => handleError("admin", error),
  );
  const unsubscribeAutomatic = onSnapshot(
    AUTOMATIC_PRICE_DOCUMENT,
    (snapshot) => handleSnapshot("automatic", snapshot),
    (error) => handleError("automatic", error),
  );

  return () => {
    unsubscribeAdmin();
    unsubscribeAutomatic();
  };
}

export function subscribeToCoffeePriceHistory(
  onUpdate: (history: CoffeePriceHistoryPoint[]) => void,
  onError: (error: Error) => void,
): () => void {
  const historyQuery = query(
    collection(db, "marketPriceHistory"),
    orderBy("effectiveDate", "desc"),
    limit(60),
  );
  return onSnapshot(historyQuery, (snapshot) => {
    try {
      const history = snapshot.docs
        .map((item) => parseSnapshot(item.data()))
        .sort((left, right) => left.effectiveDate.localeCompare(right.effectiveDate));
      onUpdate(history);
    } catch (error) {
      onError(error instanceof Error ? error : new Error("UCDA price history is invalid."));
    }
  }, (error) => onError(new Error("UCDA price history could not be loaded.", { cause: error })));
}

export async function refreshUcdaCoffeePrices(): Promise<void> {
  const response = await authenticatedFetch("/api/getUcdaCoffeePrices", { method: "POST" });
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || `UCDA coffee prices could not be refreshed (HTTP ${response.status}).`);
  }
}

export async function restoreAutomaticCoffeePrices(): Promise<void> {
  if (!auth.currentUser) throw new Error("Sign in as a platform administrator to restore automatic prices.");
  try {
    await deleteDoc(ADMIN_PRICE_DOCUMENT);
  } catch (error) {
    console.error("The admin coffee-price override could not be removed.", error);
    throw new Error("Automatic prices were not restored. Check your connection and administrator permissions.", {
      cause: error,
    });
  }
}

export async function publishDailyCoffeePrices(input: DailyCoffeePriceInput): Promise<void> {
  if (!auth.currentUser) throw new Error("Sign in as a platform administrator to publish coffee prices.");
  if (!isValidDate(input.effectiveDate)) throw new Error("Enter a valid effective date.");
  if (!input.source.trim() || input.source.trim().length > 300) {
    throw new Error("Enter a price source or reference of up to 300 characters.");
  }

  for (const product of COFFEE_PRICE_PRODUCTS) {
    const rate = input.rates[product.id];
    if (
      !Number.isFinite(rate.minimum)
      || !Number.isFinite(rate.maximum)
      || rate.minimum < 0
      || rate.maximum < rate.minimum
    ) {
      throw new Error(`Enter a valid UGX/kg range for ${product.label}.`);
    }
  }

  try {
    await setDoc(ADMIN_PRICE_DOCUMENT, {
      effectiveDate: input.effectiveDate,
      source: input.source.trim(),
      rates: {
        robustaKiboko: { ...input.rates.robustaKiboko },
        robustaFaq: { ...input.rates.robustaFaq },
        arabicaParchment: { ...input.rates.arabicaParchment },
      },
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid,
    });
  } catch (error) {
    console.error("Daily coffee prices could not be published.", error);
    throw new Error("Coffee prices were not published. Check your connection and administrator permissions.", {
      cause: error,
    });
  }
}
