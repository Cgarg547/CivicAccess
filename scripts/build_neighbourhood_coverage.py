
import csv
import json
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.prepared import prep


ROOT = Path(__file__).resolve().parents[1]

NEIGHBOURHOODS_PATH = (
    ROOT
    / "data/raw/neighbourhoods/Neighbourhoods - 4326.geojson"
)

WASHROOMS_PATH = (
    ROOT
    / "data/processed/washrooms/washroom_sites_enriched.geojson"
)

OUTPUT_DIR = ROOT / "data/processed/neighbourhoods"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CSV_OUTPUT = OUTPUT_DIR / "neighbourhood_washroom_coverage.csv"
GEOJSON_OUTPUT = OUTPUT_DIR / "neighbourhood_washroom_coverage.geojson"
UNMATCHED_OUTPUT = OUTPUT_DIR / "unmatched_washroom_sites.geojson"


def load_geojson(path):
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def has_accessibility_evidence(properties):
    if properties.get("source") == "crem":
        return (properties.get("accessible_yes_count") or 0) > 0

    features = properties.get("accessibility_features")
    return isinstance(features, str) and bool(features.strip())


def main():
    neighbourhood_data = load_geojson(NEIGHBOURHOODS_PATH)
    washroom_data = load_geojson(WASHROOMS_PATH)

    neighbourhood_features = neighbourhood_data["features"]
    washroom_features = washroom_data["features"]

    print("=" * 60)
    print("CIVICACCESS NEIGHBOURHOOD COVERAGE")
    print("=" * 60)
    print(f"Neighbourhoods: {len(neighbourhood_features)}")
    print(f"Candidate washroom sites: {len(washroom_features)}")

    neighbourhoods = []

    for feature in neighbourhood_features:
        properties = feature["properties"]
        geometry = shape(feature["geometry"])

        neighbourhoods.append({
            "feature": feature,
            "geometry": geometry,
            "prepared": prep(geometry),
            "code": str(properties["AREA_SHORT_CODE"]),
            "name": properties["AREA_NAME"],
            "candidate_site_count": 0,
            "parks_site_count": 0,
            "crem_site_count": 0,
            "accessibility_reported_site_count": 0,
            "underlying_record_count": 0,
        })

    unmatched = []
    ambiguous = []

    for site in washroom_features:
        properties = site["properties"]
        longitude, latitude = site["geometry"]["coordinates"]

        point = Point(longitude, latitude)

        # Covers includes points on a polygon boundary.
        matches = [
            neighbourhood
            for neighbourhood in neighbourhoods
            if neighbourhood["prepared"].covers(point)
        ]

        if len(matches) == 0:
            unmatched.append(site)
            continue

        if len(matches) > 1:
            ambiguous.append({
                "site_id": properties["site_id"],
                "neighbourhoods": [
                    item["name"] for item in matches
                ],
            })
            continue

        neighbourhood = matches[0]

        neighbourhood["candidate_site_count"] += 1

        neighbourhood["underlying_record_count"] += (
            properties.get("source_record_count") or 0
        )

        if properties.get("source") == "parks":
            neighbourhood["parks_site_count"] += 1

        elif properties.get("source") == "crem":
            neighbourhood["crem_site_count"] += 1

        if has_accessibility_evidence(properties):
            neighbourhood[
                "accessibility_reported_site_count"
            ] += 1

    output_rows = []
    output_features = []

    for neighbourhood in neighbourhoods:
        row = {
            "neighbourhood_code": neighbourhood["code"],
            "neighbourhood_name": neighbourhood["name"],
            "candidate_site_count": neighbourhood[
                "candidate_site_count"
            ],
            "parks_site_count": neighbourhood[
                "parks_site_count"
            ],
            "crem_site_count": neighbourhood[
                "crem_site_count"
            ],
            "accessibility_reported_site_count": neighbourhood[
                "accessibility_reported_site_count"
            ],
            "underlying_record_count": neighbourhood[
                "underlying_record_count"
            ],
        }

        output_rows.append(row)

        original_feature = neighbourhood["feature"]

        output_features.append({
            "type": "Feature",
            "properties": {
                **original_feature["properties"],
                **row,
            },
            "geometry": original_feature["geometry"],
        })

    output_rows.sort(
        key=lambda row: (
            row["candidate_site_count"],
            row["neighbourhood_name"],
        )
    )

    with open(CSV_OUTPUT, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=list(output_rows[0].keys()),
        )
        writer.writeheader()
        writer.writerows(output_rows)

    with open(GEOJSON_OUTPUT, "w", encoding="utf-8") as file:
        json.dump({
            "type": "FeatureCollection",
            "features": output_features,
        }, file)

    with open(UNMATCHED_OUTPUT, "w", encoding="utf-8") as file:
        json.dump({
            "type": "FeatureCollection",
            "features": unmatched,
        }, file)

    assigned_count = sum(
        row["candidate_site_count"] for row in output_rows
    )

    print("\nRESULTS")
    print("-" * 60)
    print(f"Assigned sites: {assigned_count}")
    print(f"Unmatched sites: {len(unmatched)}")
    print(f"Ambiguous boundary matches: {len(ambiguous)}")

    print(
        "Neighbourhoods with zero sites:",
        sum(
            row["candidate_site_count"] == 0
            for row in output_rows
        ),
    )

    print("\nFIVE NEIGHBOURHOODS WITH FEWEST SITES")
    for row in output_rows[:5]:
        print(
            f"{row['neighbourhood_name']}: "
            f"{row['candidate_site_count']}"
        )

    if unmatched:
        print("\nUNMATCHED SITE IDS")
        for site in unmatched:
            print(site["properties"]["site_id"])

    if ambiguous:
        print("\nAMBIGUOUS SITE MATCHES")
        for item in ambiguous:
            print(item)

    print("\nOUTPUT FILES")
    print(CSV_OUTPUT)
    print(GEOJSON_OUTPUT)
    print(UNMATCHED_OUTPUT)

    print("\nVALIDATION")
    accounted_for = (
        assigned_count + len(unmatched) + len(ambiguous)
    )

    print(
        f"Accounted for: {accounted_for} / "
        f"{len(washroom_features)}"
    )

    assert accounted_for == len(washroom_features), (
        "Some sites were not accounted for"
    )

    assert len(output_rows) == len(neighbourhood_features)

    print("Validation passed.")


if __name__ == "__main__":
    main()
