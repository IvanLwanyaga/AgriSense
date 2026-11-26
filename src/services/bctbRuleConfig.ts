import type { RuleConfiguration } from "../types/ruleConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { authenticatedFetch } from "./authenticatedFetch";

export const DEFAULT_RULE_CONFIG: RuleConfiguration = {
  id: "rule_config_v1_0",
  version: "bctb-rules-v1.0.0",
  name: "Uganda Robusta Coffee BCTB Expert Rules V1.0",
  description: "Deterministic agro-ecological rule base for Black Coffee Twig Borer (Xylosandrus compactus) risk screening in Robusta coffee, pending agronomist validation.",
  active: true,
  validationStatus: "pending_validation_by_coffee_agronomist",
  weights: {
    pinSizedHoles: 30,
    increasingDamage: 20,
    previousBctbHistory: 15,
    twigWiltingDrying: 15,
    twigBlackening: 15,
    leafYellowing: 10,
    affectedTwigCountFactor: 2, // 2 points per twig up to maxTwigCountScore
    maxTwigCountScore: 20,
    poorSanitation: 10,
    inconsistentTwigRemoval: 10,
    denseShade: 10,
    weatherDrySpellDays: 15, // >=14 consecutive dry spell days
    weatherRainDeficit: 10,  // <50mm 30-day cumulative rainfall
  },
  thresholds: {
    lowMax: 29,
    moderateMax: 59,
  },
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
  author: "AgriSense Coffee Technical Working Group",
};

const LOCAL_RULES_KEY = "agrisense_bctb_rules_v1";

export function getActiveRuleConfiguration(): RuleConfiguration {
  try {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(LOCAL_RULES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RuleConfiguration;
        if (parsed && parsed.version) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("Could not read local rule config; using default", err);
  }
  return DEFAULT_RULE_CONFIG;
}

export function saveRuleConfiguration(config: RuleConfiguration): void {
  try {
    localStorage.setItem(LOCAL_RULES_KEY, JSON.stringify(config));
  } catch (err) {
    console.error("Could not persist rule config", err);
  }
}

export async function getRuleConfigurations(): Promise<RuleConfiguration[]> {
  const snapshot = await getDocs(query(collection(db, "ruleConfigurations")));
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as RuleConfiguration)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function refreshActiveRuleConfiguration(): Promise<RuleConfiguration> {
  const snapshot = await getDocs(query(collection(db, "ruleConfigurations"), where("active", "==", true)));
  const config = snapshot.docs[0]?.data() as RuleConfiguration | undefined;
  if (!config?.version) return getActiveRuleConfiguration();
  saveRuleConfiguration(config);
  return config;
}

export async function saveRuleConfigurationToServer(config: RuleConfiguration): Promise<void> {
  const response = await authenticatedFetch("/api/adminUpdateRules", {
    method: "POST",
    body: JSON.stringify({ ruleConfig: config }),
  });
  const result = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(result.error || "Rule configuration could not be saved.");
  saveRuleConfiguration(config);
}

