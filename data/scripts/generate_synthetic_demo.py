"""
AgriSense-BCTB Synthetic Demonstration Dataset Generator
Strict compliance with Section 25.16 & 25.19:
- Clearly stamps all records with 'DEMO_ONLY - Not real agricultural observations'.
- Generates 350 realistic demonstration cases across Robusta coffee growing districts in Uganda.
"""

import csv
import random

DISTRICTS = [
    ("Mukono", ["Kyampisi", "Ntenjeru", "Goma", "Nakifuma"]),
    ("Wakiso", ["Namayumba", "Kakiri", "Wakiso TC", "Kira"]),
    ("Luweero", ["Zirobwe", "Wobulenzi", "Luwero TC", "Kamira"]),
    ("Masaka", ["Kyanamukaka", "Bukakata", "Kabuuma", "Buwunga"]),
    ("Mpigi", ["Muduuma", "Kammengo", "Mpigi TC", "Buwama"]),
    ("Mubende", ["Madudu", "Kasambya", "Bagezza", "Kitenga"]),
]

VARIETIES = ["ROBUSTA_CWDr_CLONAL", "ROBUSTA_TRADITIONAL", "ROBUSTA_MIXED"]
AGES = ["YOUNG_UNDER_3", "MATURE_3_TO_15", "OLD_OVER_15"]
SHADES = ["DENSE", "MODERATE", "OPEN_FULL_SUN"]
REMOVALS = ["CONSISTENT", "INCONSISTENT", "NONE"]
SANITATIONS = ["GOOD", "FAIR", "POOR"]

def generate():
    records = []
    random.seed(42)  # Deterministic seed for reproducible evaluation

    for i in range(1, 351):
        dist_info = random.choice(DISTRICTS)
        district = dist_info[0]
        sub_county = random.choice(dist_info[1])
        variety = random.choice(VARIETIES)
        age = random.choice(AGES)
        shade = random.choice(SHADES)
        
        # Correlated risk scenario generation
        scenario_type = random.choices(["LOW", "MODERATE", "HIGH"], weights=[0.45, 0.35, 0.20])[0]

        if scenario_type == "HIGH":
            pin_holes = 1
            blackening = random.choice([0, 1])
            wilting = 1
            yellowing = 1
            twig_count = random.randint(8, 30)
            increasing_damage = 1
            bctb_history = random.choice([0, 1])
            removal = random.choice(["INCONSISTENT", "NONE"])
            sanitation = random.choice(["FAIR", "POOR"])
            dry_days = random.randint(12, 25)
            rain_30d = round(random.uniform(10.0, 45.0), 1)
            score = min(100, 60 + random.randint(0, 35))
            verified = random.choices(["CONFIRMED_BCTB", "OTHER_PEST", "PENDING"], weights=[0.75, 0.15, 0.10])[0]
        elif scenario_type == "MODERATE":
            pin_holes = random.choice([0, 1])
            blackening = random.choice([0, 1])
            wilting = 1
            yellowing = random.choice([0, 1])
            twig_count = random.randint(2, 8)
            increasing_damage = random.choice([0, 1])
            bctb_history = random.choice([0, 1])
            removal = random.choice(["INCONSISTENT", "CONSISTENT"])
            sanitation = random.choice(["FAIR", "GOOD"])
            dry_days = random.randint(5, 13)
            rain_30d = round(random.uniform(40.0, 75.0), 1)
            score = random.randint(30, 59)
            verified = random.choices(["UNCONFIRMED", "CONFIRMED_BCTB", "PENDING"], weights=[0.50, 0.30, 0.20])[0]
        else:
            pin_holes = 0
            blackening = 0
            wilting = random.choice([0, 1]) if random.random() < 0.15 else 0
            yellowing = random.choice([0, 1]) if random.random() < 0.20 else 0
            twig_count = random.randint(0, 2)
            increasing_damage = 0
            bctb_history = 0
            removal = "CONSISTENT"
            sanitation = "GOOD"
            dry_days = random.randint(0, 6)
            rain_30d = round(random.uniform(70.0, 130.0), 1)
            score = random.randint(0, 28)
            verified = "UNCONFIRMED"

        records.append({
            "record_id": f"DEMO_BCTB_{i:04d}",
            "observation_date": f"2026-08-{random.randint(1, 30):02d}",
            "district": district,
            "sub_county": sub_county,
            "farm_acreage": round(random.uniform(0.5, 6.0), 1),
            "coffee_variety": variety,
            "coffee_age": age,
            "shade_canopy": shade,
            "pin_sized_holes": pin_holes,
            "twig_blackening": blackening,
            "wilting_drying": wilting,
            "leaf_yellowing": yellowing,
            "affected_twig_count": twig_count,
            "increasing_damage": increasing_damage,
            "previous_bctb_history": bctb_history,
            "affected_twig_removal": removal,
            "farm_sanitation": sanitation,
            "consecutive_dry_spell_days": dry_days,
            "cumulative_rainfall_30d_mm": rain_30d,
            "risk_score": score,
            "risk_level": scenario_type,
            "verified_observation": verified,
            "data_lineage_label": "DEMO_ONLY - Not real agricultural observations",
        })

    with open("../bctb_synthetic_demo.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(records[0].keys()))
        writer.writeheader()
        writer.writerows(records)

    print(f"Generated {len(records)} synthetic demonstration records with DEMO_ONLY label.")

if __name__ == "__main__":
    generate()

