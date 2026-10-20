"""Validate CivicAccess park proximity indicators."""

import json
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform


ROOT = Path(__file__).resolve().parents[1]

PARKS = ROOT / "data/processed/parks/park_washroom_proximity.geojson"
SITES = ROOT / "data/processed/washrooms/washroom_sites_candidates.geojson"


def load_features(path):
    with path.open(encoding="utf-8") as file:
        return json.load(file)["features"]


def main():
    parks = load_features(PARKS)
    sites = load_features(SITES)

    project = Transformer.from_crs(
        "EPSG:4326", "EPSG:26917", always_xy=True
    ).transform

    points = [
        transform(project, shape(site["geometry"]))
        for site in sites
    ]

    distance_errors = []
    count_errors = []
    max_difference = 0.0

    for feature in parks:
        props = feature["properties"]
        park = transform(project, shape(feature["geometry"]))

        calculated_distance = min(
            park.distance(point) for point in points
        )
        recorded_distance = props["nearest_site_distance_m"]

        difference = abs(calculated_distance - recorded_distance)
        max_difference = max(max_difference, difference)

        if difference > 0.01:
            distance_errors.append(props["AREA_ID"])

        calculated_count = sum(
            park.covers(point) for point in points
        )

        if calculated_count != props["internal_candidate_count"]:
            count_errors.append(props["AREA_ID"])

    print("CIVICACCESS PARK PROXIMITY VALIDATION")
    print("-" * 45)
    print("Parks checked:", len(parks))
    print("Candidate sites:", len(points))
    print("Distance mismatches:", len(distance_errors))
    print("Internal-site count mismatches:", len(count_errors))
    print(f"Maximum distance difference: {max_difference:.6f} m")

    if distance_errors:
        print("Distance mismatch IDs:", distance_errors[:10])

    if count_errors:
        print("Count mismatch IDs:", count_errors[:10])

    if distance_errors or count_errors:
        print("\nFAIL: Review mismatched records.")
        raise SystemExit(1)

    print("\nPASS: All park proximity indicators reproduced.")


if __name__ == "__main__":
    main()
