"""
Download daily NASA POWER weather for each site in data/raw/sites.csv.
Fill in valid decimal latitude/longitude values before running.
Output: data/raw/nasa_power_weather.csv
"""
from pathlib import Path
import time
import requests
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SITES_FILE = ROOT / "data/raw/sites.csv"
OUT_FILE = ROOT / "data/raw/nasa_power_weather.csv"

START_DATE = "20180101"
END_DATE = "20261231"
PARAMETERS = ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR", "RH2M", "WS10M"]
BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

def fetch_site(site):
    params = {
        "parameters": ",".join(PARAMETERS),
        "community": "AG",
        "longitude": float(site.longitude),
        "latitude": float(site.latitude),
        "start": START_DATE,
        "end": END_DATE,
        "format": "JSON",
    }
    response = requests.get(BASE_URL, params=params, timeout=90)
    response.raise_for_status()
    payload = response.json()
    parameter_data = payload["properties"]["parameter"]

    frames = []
    for parameter in PARAMETERS:
        series = pd.Series(parameter_data[parameter], name=parameter)
        series.index.name = "date_key"
        frames.append(series)
    df = pd.concat(frames, axis=1).reset_index()
    df["date"] = pd.to_datetime(df["date_key"], format="%Y%m%d")
    df.drop(columns=["date_key"], inplace=True)
    df.insert(0, "site_id", site.site_id)
    df.insert(1, "site_name", site.site_name)
    df["latitude"] = float(site.latitude)
    df["longitude"] = float(site.longitude)
    return df

def main():
    sites = pd.read_csv(SITES_FILE)
    sites["latitude"] = pd.to_numeric(sites["latitude"], errors="coerce")
    sites["longitude"] = pd.to_numeric(sites["longitude"], errors="coerce")
    invalid = sites[sites["latitude"].isna() | sites["longitude"].isna()]
    if not invalid.empty:
        print("Add latitude and longitude for these rows in data/raw/sites.csv:")
        print(invalid[["site_id", "site_name"]].to_string(index=False))
        raise SystemExit("Stopped: coordinates are required; do not use guessed coordinates.")

    all_data = []
    for _, site in sites.iterrows():
        print(f"Downloading NASA POWER weather: {site.site_name}")
        all_data.append(fetch_site(site))
        time.sleep(1)

    result = pd.concat(all_data, ignore_index=True)
    result.sort_values(["site_id", "date"], inplace=True)
    result.to_csv(OUT_FILE, index=False)
    print(f"Saved {len(result):,} rows to {OUT_FILE}")
    print(result.head())

if __name__ == "__main__":
    main()
