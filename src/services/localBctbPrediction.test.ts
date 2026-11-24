import { describe, expect, it } from "vitest";
import { buildLocalResearchPrediction, buildLocalResearchPredictionFromInputs } from "./localBctbPrediction";
import type { ResearchBctbModelInputs } from "../types/bctb";

const inputs: ResearchBctbModelInputs = {
  twig_dieback_observed: 1,
  suspected_entry_holes_observed: 1,
  affected_twig_count_reported: 2,
  previous_bctb_report: 1,
  farm_sanitation: "good",
  pruning_frequency: "regular",
  recent_pruning_done: 1,
  increasing_twig_damage: null,
  yellowing_observed: null,
  blackening_observed: null,
  wilting_observed: null,
  drying_observed: null,
  nearby_host_vegetation: null,
  unmanaged_suckers_present: null,
  recent_desuckering_done: null,
  affected_twig_removal: null,
  coffee_age: null,
  shade_canopy: null,
  coffee_variety: null,
  affected_twig_diameter_mm: null,
  rainfall_30d_mm: null,
  mean_temperature_30d_c: null,
  mean_relative_humidity_30d_pct: null,
  canopy_cover_pct: null,
  shade_tree_count: null,
  distance_to_woodland_m: null,
  drought_stress_observed: null,
  recently_transplanted: null,
  infested_twigs_removed: null,
  coffee_trees_inspected: null,
  trees_with_possible_signs: null,
  plot_area_ha: null,
  shade_tree_species: null,
  inspection_month: null,
};

describe("localBctbPrediction", () => {
  it("always returns a valid prediction from model inputs", () => {
    const prediction = buildLocalResearchPredictionFromInputs(inputs);
    expect(["LOW", "MODERATE", "HIGH"]).toContain(prediction.predicted_risk);
    const total = Object.values(prediction.class_probabilities).reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(1, 5);
    expect(prediction.actionable_steps.length).toBeGreaterThan(0);
    expect(prediction.shap_contributions.length).toBeGreaterThan(0);
    expect(prediction.model_name).toBe("AgriSense Local Rule Engine");
  });

  it("returns a valid prediction from a partial assessment", () => {
    const prediction = buildLocalResearchPrediction({
      pinSizedHoles: true,
      twigDiebackObserved: true,
      affectedTwigCount: 2,
      previousBctbHistory: true,
      farmSanitation: "GOOD",
      pruningFrequency: "regular",
      recentPruning: true,
      locationConsent: false,
      followUpConsent: false,
    });
    expect(prediction.predicted_risk).toBeTruthy();
    expect(prediction.input_total).toBe(34);
    expect(prediction.actionable_steps.length).toBeGreaterThan(0);
  });
});