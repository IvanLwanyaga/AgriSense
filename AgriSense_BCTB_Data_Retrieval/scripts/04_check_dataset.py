"""Basic completeness and duplicate checks for the generated dataset."""
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / "data/processed/agrisense_synthetic_demo_dataset.csv"

def main():
    df = pd.read_csv(FILE)
    print("Shape:", df.shape)
    print("\nMissing values (top 20):")
    print(df.isna().sum().sort_values(ascending=False).head(20))
    print("\nDuplicate record IDs:", df["record_id"].duplicated().sum())
    print("\nRisk band counts:")
    print(df["synthetic_demo_risk_band"].value_counts(dropna=False))
    print("\nData provenance:")
    print(df["assessment_source"].value_counts(dropna=False))
    print("\nReminder: synthetic risk labels are not verified BCTB outcomes.")

if __name__ == "__main__":
    main()
