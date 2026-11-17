"""Build an expanded, explicitly synthetic dataset for end-to-end demos only.

The extra variables are simulated and the scoring weights are teaching
assumptions. This file must never be described as field evidence or used to
claim real BCTB prediction performance.
"""
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "processed" / "agrisense_synthetic_demo_dataset.csv"
DESTINATION = ROOT / "data" / "processed" / "agrisense_synthetic_expanded_dataset.csv"
SEED = 20261116


def main() -> None:
    source = pd.read_csv(SOURCE)
    rng = np.random.default_rng(SEED)
    data = pd.DataFrame(index=source.index)

    for feature in (
        "twig_dieback_observed", "suspected_entry_holes_observed",
        "affected_twig_count_reported", "previous_bctb_report", "recent_pruning_done",
        "farm_sanitation", "pruning_frequency",
    ):
        data[feature] = source[feature]

    shade = source["shade_level"].fillna("moderate").str.lower()
    data["shade_canopy"] = shade.where(shade.isin(["dense", "moderate"]), "open_full_sun")
    data["canopy_cover_pct"] = np.clip(
        np.select([shade.eq("dense"), shade.eq("moderate")], [68, 42], default=18)
        + rng.normal(0, 10, len(source)), 0, 100,
    ).round(1)
    data["shade_tree_count"] = np.maximum(
        0, np.select([shade.eq("dense"), shade.eq("moderate")], [34, 18], default=5)
        + rng.normal(0, 8, len(source)),
    ).round().astype(int)
    data["shade_tree_species"] = rng.choice(
        ["albizia", "cordia", "grevillea", "banana", "mixed", "unknown"],
        len(source), p=[.18, .13, .12, .16, .25, .16],
    )
    data["distance_to_woodland_m"] = np.clip(rng.lognormal(5.0, .9, len(source)), 0, 10000).round(1)
    data["nearby_host_vegetation"] = (
        (data["distance_to_woodland_m"] < 250) | (rng.random(len(source)) < .22)
    ).astype(int)

    data["rainfall_30d_mm"] = source["PRECTOTCORR_30d_sum"].clip(lower=0).round(1)
    data["mean_temperature_30d_c"] = source["T2M_30d_mean"].round(1)
    data["mean_relative_humidity_30d_pct"] = source["RH2M_30d_mean"].clip(0, 100).round(1)
    data["drought_stress_observed"] = (
        (data["rainfall_30d_mm"] < data["rainfall_30d_mm"].quantile(.2))
        & (rng.random(len(source)) < .65)
    ).astype(int)
    data["recently_transplanted"] = (rng.random(len(source)) < .07).astype(int)
    data["affected_twig_diameter_mm"] = np.clip(rng.normal(5.5, 1.8, len(source)), 1, 16).round(1)

    data["increasing_twig_damage"] = (
        (source["twig_dieback_observed"].eq(1) | source["suspected_entry_holes_observed"].eq(1))
        & (rng.random(len(source)) < .42)
    ).astype(int)
    for feature, probability in (
        ("yellowing_observed", .28), ("blackening_observed", .35),
        ("wilting_observed", .22), ("drying_observed", .24),
    ):
        evidence = source["twig_dieback_observed"].eq(1) | source["suspected_entry_holes_observed"].eq(1)
        data[feature] = (evidence & (rng.random(len(source)) < probability)).astype(int)

    data["unmanaged_suckers_present"] = (
        (source["farm_sanitation"].eq("poor")) & (rng.random(len(source)) < .55)
    ).astype(int)
    data["recent_desuckering_done"] = (rng.random(len(source)) < .42).astype(int)
    data["affected_twig_removal"] = np.select(
        [source["farm_sanitation"].eq("good"), source["farm_sanitation"].eq("poor")],
        ["consistent", "none"], default="inconsistent",
    )
    data["infested_twigs_removed"] = data["affected_twig_removal"].eq("consistent").astype(int)

    data["coffee_age"] = pd.cut(
        source["farm_age_years"], bins=[-1, 2, 15, 100],
        labels=["young_under_3", "mature_3_to_15", "old_over_15"],
    ).astype("string").fillna("mature_3_to_15")
    data["coffee_variety"] = rng.choice(
        ["robusta_traditional", "robusta_cwdr_clonal", "robusta_mixed"],
        len(source), p=[.55, .25, .20],
    )
    data["plot_area_ha"] = np.clip(rng.lognormal(-.1, .8, len(source)), .05, 10).round(2)
    data["coffee_trees_inspected"] = rng.integers(10, 61, len(source))
    sign_strength = (
        source["twig_dieback_observed"].to_numpy()
        + source["suspected_entry_holes_observed"].to_numpy()
        + np.minimum(source["affected_twig_count_reported"].to_numpy(), 8) / 4
    )
    sample_rate = np.clip(.02 + sign_strength * .055 + rng.normal(0, .07, len(source)), 0, .85)
    data["trees_with_possible_signs"] = np.minimum(
        data["coffee_trees_inspected"],
        np.round(data["coffee_trees_inspected"] * sample_rate),
    ).astype(int)
    data["inspection_month"] = pd.to_datetime(source["assessment_date"]).dt.month

    # These made-up effects exist only to exercise preprocessing, SHAP, and UI flow.
    score = (
        2.1 * data["suspected_entry_holes_observed"]
        + 1.2 * data["twig_dieback_observed"]
        + .20 * np.log1p(data["affected_twig_count_reported"])
        + .45 * data["previous_bctb_report"]
        + .35 * data["farm_sanitation"].map({"poor": 1, "moderate": .4, "good": 0})
        + .25 * data["pruning_frequency"].map({"rare": 1, "occasional": .4, "regular": 0})
        + .55 * data["increasing_twig_damage"]
        + .12 * data[["yellowing_observed", "blackening_observed", "wilting_observed", "drying_observed"]].sum(axis=1)
        + .20 * data["nearby_host_vegetation"]
        + .12 * data["unmanaged_suckers_present"]
        + .30 * (1 - data["infested_twigs_removed"])
        + .18 * data["drought_stress_observed"]
        + .12 * data["recently_transplanted"]
        + .25 * (data["trees_with_possible_signs"] / data["coffee_trees_inspected"])
        + .15 * (data["distance_to_woodland_m"] < 250)
        + .12 * (data["affected_twig_diameter_mm"] < 5)
        + .08 * (data["canopy_cover_pct"] > 70)
        + .06 * (data["shade_tree_count"] > 35)
        + .06 * ((data["rainfall_30d_mm"] < 80) | (data["rainfall_30d_mm"] > 350))
        + .04 * ((data["mean_temperature_30d_c"] < 19) | (data["mean_temperature_30d_c"] > 27))
        + .04 * (data["mean_relative_humidity_30d_pct"] < 60)
        + .03 * data["plot_area_ha"]
        + .03 * (data["shade_tree_species"].eq("unknown"))
        + .03 * data["recent_pruning_done"]
        + .02 * data["recent_desuckering_done"]
        + .02 * data["inspection_month"].isin([3, 4, 9, 10])
        + .02 * data["coffee_age"].eq("old_over_15")
        + .02 * data["shade_canopy"].eq("dense")
        + .02 * data["coffee_variety"].eq("robusta_traditional")
    )
    low_cut, high_cut = score.quantile([.34, .68])
    data["synthetic_demo_risk_band"] = np.select(
        [score <= low_cut, score <= high_cut], ["LOW", "MODERATE"], default="HIGH",
    )
    data["farm_id"] = source["farm_id"].astype(str)
    data["record_id"] = source["record_id"].astype(str)
    data["label_provenance"] = "SYNTHETIC_EXPANDED_RULE_LABEL_NOT_VERIFIED"

    data.to_csv(DESTINATION, index=False)
    print(f"Wrote {len(data)} explicitly synthetic rows to {DESTINATION}")
    print(data["synthetic_demo_risk_band"].value_counts().to_string())


if __name__ == "__main__":
    main()
