
from pathlib import Path
import time
import requests
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]

INPUT = ROOT / "data/raw/sites.csv"
OUTPUT = ROOT / "data/raw/sites_coordinate_candidates.csv"

URL = "https://nominatim.openstreetmap.org/search"

headers = {
    "User-Agent": "AgriSense-BCTB-Research/1.0"
}

sites = pd.read_csv(INPUT)

results = []

for _, site in sites.iterrows():
    name = site["site_name"]
    print(f"Looking up: {name}, Uganda")

    params = {
    "q": f"{name}, Uganda",
    "format": "jsonv2",
    "countrycodes": "ug",
    "limit": 10,
    "addressdetails": 1
}

    try:
        response = requests.get(
            URL,
            params=params,
            headers=headers,
            timeout=30
        )
        response.raise_for_status()
        candidates = response.json()

        if candidates:
            for candidate in candidates:
                results.append({
                    "site_id": site["site_id"],
                    "site_name": name,
                    "latitude": candidate["lat"],
                    "longitude": candidate["lon"],
                    "location_found": candidate["display_name"],
                    "osm_type": candidate.get("type", ""),
                    "osm_class": candidate.get("category", "")
                })
        else:
            results.append({
                "site_id": site["site_id"],
                "site_name": name,
                "latitude": "",
                "longitude": "",
                "location_found": "NOT FOUND",
                "osm_type": "",
                "osm_class": ""
            })

    except requests.RequestException as error:
        print(f"Error looking up {name}: {error}")

    time.sleep(1.1)

df = pd.DataFrame(results)
df.to_csv(OUTPUT, index=False)

print("\nCoordinate lookup completed.")
print(f"Candidates saved to: {OUTPUT}")
print(f"Total candidate records: {len(df)}")
print("\nReview the locations before using their coordinates.")
