"""
Attach weather summaries for the 30 days ending on each synthetic assessment date.
Output: data/processed/agrisense_synthetic_demo_dataset.csv
"""
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
WEATHER_FILE = ROOT / "data/raw/nasa_power_weather.csv"
ASSESSMENT_FILE = ROOT / "data/processed/synthetic_farm_assessments.csv"
OUT_FILE = ROOT / "data/processed/agrisense_synthetic_demo_dataset.csv"

WEATHER_COLS = ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR", "RH2M", "WS10M"]

def main():
    weather = pd.read_csv(WEATHER_FILE, parse_dates=["date"])
    assessments = pd.read_csv(ASSESSMENT_FILE, parse_dates=["assessment_date"])

    rows = []
    for _, record in assessments.iterrows():
        start = record["assessment_date"] - pd.Timedelta(days=29)
        subset = weather[
            (weather["site_id"] == record["site_id"]) &
            (weather["date"] >= start) &
            (weather["date"] <= record["assessment_date"])
        ]
        item = record.to_dict()
        item["weather_days_available"] = len(subset)
        for col in WEATHER_COLS:
            item[f"{col}_30d_mean"] = subset[col].mean() if len(subset) else float("nan")
            if col == "PRECTOTCORR":
                item["PRECTOTCORR_30d_sum"] = subset[col].sum(min_count=1)
        rows.append(item)

    result = pd.DataFrame(rows)
    result.to_csv(OUT_FILE, index=False)
    print(f"Saved {len(result):,} rows to {OUT_FILE}")
    print("Rows with fewer than 20 weather days:",
          int((result["weather_days_available"] < 20).sum()))

if __name__ == "__main__":
    main()
