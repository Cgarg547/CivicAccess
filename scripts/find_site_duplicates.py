
from pathlib import Path
import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "data/processed/washrooms"

INPUT = FOLDER / "washroom_sites_candidates.geojson"
OUTPUT = FOLDER / "cross_source_duplicate_candidates.csv"

DISTANCE_THRESHOLD_METRES = 100


def main():
    sites = gpd.read_file(INPUT)

    if sites.crs is None:
        raise ValueError("Input dataset has no coordinate system")

    # Project coordinates so distances are measured in metres.
    projected = sites.to_crs("EPSG:26917")

    parks = projected[
        projected["source"] == "parks"
    ].copy()

    crem = projected[
        projected["source"] == "crem"
    ].copy()

    matches = []

    for _, crem_row in crem.iterrows():
        for _, parks_row in parks.iterrows():
            distance = crem_row.geometry.distance(
                parks_row.geometry
            )

            if distance <= DISTANCE_THRESHOLD_METRES:
                matches.append({
                    "crem_site_id": crem_row["site_id"],
                    "crem_site_name": crem_row["site_name"],
                    "crem_address": crem_row["address"],
                    "parks_site_id": parks_row["site_id"],
                    "parks_site_name": parks_row["site_name"],
                    "parks_address": parks_row["address"],
                    "distance_metres": round(
                        float(distance), 2
                    ),
                    "review_status": "needs_review",
                    "same_physical_site": "",
                })

    columns = [
        "crem_site_id",
        "crem_site_name",
        "crem_address",
        "parks_site_id",
        "parks_site_name",
        "parks_address",
        "distance_metres",
        "review_status",
        "same_physical_site",
    ]

    results = pd.DataFrame(matches, columns=columns)

    if not results.empty:
        results = results.sort_values(
            "distance_metres"
        ).reset_index(drop=True)

    results.to_csv(OUTPUT, index=False)

    print("=" * 65)
    print("CIVICACCESS — CROSS-SOURCE DUPLICATE DETECTION")
    print("=" * 65)

    print("Parks sites:", len(parks))
    print("CREM sites:", len(crem))
    print("Distance threshold:", DISTANCE_THRESHOLD_METRES, "metres")
    print("Candidate pairs:", len(results))

    if not results.empty:
        print("\nPotential overlaps:")
        print(
            results[
                [
                    "crem_site_name",
                    "parks_site_name",
                    "distance_metres",
                ]
            ].to_string(index=False)
        )
    else:
        print("\nNo cross-source pairs within the threshold.")

    print("\nSaved:", OUTPUT.relative_to(ROOT))
    print("No records have been merged or deleted.")


if __name__ == "__main__":
    main()
