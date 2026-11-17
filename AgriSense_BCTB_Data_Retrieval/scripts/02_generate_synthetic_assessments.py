"""
Generate DEMONSTRATION-ONLY synthetic farm assessment records.
These are not field observations and do not represent verified BCTB cases.
The synthetic target is illustrative only; do not report model scores from it
as evidence of real-world BCTB prediction.
Output: data/processed/synthetic_farm_assessments.csv
"""
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SITES_FILE = ROOT / "data/raw/sites.csv"
OUT_FILE = ROOT / "data/processed/synthetic_farm_assessments.csv"

N_RECORDS = 1200
SEED = 42

def main():
    rng = np.random.default_rng(SEED)
    sites = pd.read_csv(SITES_FILE)
    sites = sites.dropna(subset=["site_id", "site_name"])
    if sites.empty:
        raise SystemExit("No sites found in data/raw/sites.csv")

    site_idx = rng.integers(0, len(sites), N_RECORDS)
    chosen = sites.iloc[site_idx].reset_index(drop=True)
    dates = pd.to_datetime(
        rng.integers(
            pd.Timestamp("2022-01-01").value // 10**9,
            pd.Timestamp("2026-01-01").value // 10**9,
            N_RECORDS
        ), unit="s"
    ).normalize()

    df = pd.DataFrame({
        "record_id": [f"SYN-{i:05d}" for i in range(1, N_RECORDS + 1)],
        "farm_id": [f"SYN-FARM-{x:04d}" for x in rng.integers(1, 401, N_RECORDS)],
        "site_id": chosen["site_id"].to_numpy(),
        "site_name": chosen["site_name"].to_numpy(),
        "assessment_date": dates,
        "coffee_type": rng.choice(["Robusta"], N_RECORDS),
        "farm_age_years": rng.integers(1, 31, N_RECORDS),
        "shade_level": rng.choice(["low", "moderate", "high"], N_RECORDS, p=[.3, .5, .2]),
        "pruning_frequency": rng.choice(["regular", "occasional", "rare"], N_RECORDS, p=[.4, .4, .2]),
        "farm_sanitation": rng.choice(["good", "moderate", "poor"], N_RECORDS, p=[.35, .45, .2]),
        "twig_dieback_observed": rng.choice([0, 1], N_RECORDS, p=[.75, .25]),
        "suspected_entry_holes_observed": rng.choice([0, 1], N_RECORDS, p=[.85, .15]),
        "affected_twig_count_reported": rng.poisson(1.2, N_RECORDS),
        "previous_bctb_report": rng.choice([0, 1], N_RECORDS, p=[.9, .1]),
        "recent_pruning_done": rng.choice([0, 1], N_RECORDS, p=[.55, .45]),
        "assessment_source": "SYNTHETIC",
        "label_provenance": "SIMULATED_RULE_LABEL_NOT_VERIFIED",
    })

    # This label is deliberately only a simulated example, not a biological diagnosis.
    score = (
        2 * df["twig_dieback_observed"]
        + 2 * df["suspected_entry_holes_observed"]
        + 0.35 * df["affected_twig_count_reported"].clip(upper=5)
        + 1.2 * df["previous_bctb_report"]
        + (df["farm_sanitation"] == "poor").astype(int)
        + (df["pruning_frequency"] == "rare").astype(int)
        - 0.5 * df["recent_pruning_done"]
    )
    df["synthetic_demo_risk_band"] = pd.cut(
        score, bins=[-np.inf, 1.5, 3.5, np.inf],
        labels=["LOW", "MODERATE", "HIGH"]
    ).astype(str)

    df.to_csv(OUT_FILE, index=False)
    print(f"Saved {len(df):,} synthetic records to {OUT_FILE}")
    print(df["synthetic_demo_risk_band"].value_counts())
    print("\nWARNING: This file is synthetic demonstration data, not verified BCTB data.")

if __name__ == "__main__":
    main()
