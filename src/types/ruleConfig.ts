export interface RuleWeights {
  previousBctbHistory: number;
  increasingDamage: number;
  pinSizedHoles: number;
  twigWiltingDrying: number;
  twigBlackening: number;
  leafYellowing: number;
  affectedTwigCountFactor: number;
  maxTwigCountScore: number;
  poorSanitation: number;
  inconsistentTwigRemoval: number;
  denseShade: number;
  weatherDrySpellDays: number;
  weatherRainDeficit: number;
}

export interface RuleThresholds {
  lowMax: number; // e.g. 29
  moderateMax: number; // e.g. 59
  // high is >= moderateMax + 1
}

export interface RuleConfiguration {
  id: string;
  version: string;
  name: string;
  description: string;
  active: boolean;
  validationStatus: "pending_validation_by_coffee_agronomist" | "validated_by_agronomist";
  weights: RuleWeights;
  thresholds: RuleThresholds;
  createdAt: string;
  updatedAt: string;
  author: string;
}

