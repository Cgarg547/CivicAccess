
import csv
import json
from pathlib import Path
from statistics import median

from pyproj import Transformer
from shapely.geometry import LineString, Point
from shapely.ops import transform
from shapely.strtree import STRtree

NETWORK_PATH = Path(
    "data/raw/pedestrians/Pedestrian Network Data - 4326.geojson"
)

WASHROOM_PATH = Path(
    "data/processed/washrooms/washroom_sites_enriched.geojson"
)

OUTPUT_PATH = Path(
    "data/processed/washrooms/washroom_segment_snap_diagnostic.csv"
)


def main():
    print("=" * 65)
    print("CIVICACCESS — SEGMENT-BASED SNAP DIAGNOSTIC")
    print("=" * 65)

    with NETWORK_PATH.open(encoding="utf-8") as f:
        network = json.load(f)["features"]

    with WASHROOM_PATH.open(encoding="utf-8") as f:
        washrooms = json.load(f)["features"]

    to_meters = Transformer.from_crs(
        "EPSG:4326",
        "EPSG:26917",
        always_xy=True,
    )

    to_lonlat = Transformer.from_crs(
        "EPSG:26917",
        "EPSG:4326",
        always_xy=True,
    )

    lines = []
    source_ids = []

    print("Preparing network segments...")

    for feature in network:
        geometry = feature.get("geometry") or {}
        properties = feature.get("properties") or {}

        if geometry.get("type") != "MultiLineString":
            continue

        for coords in geometry.get("coordinates") or []:
            if len(coords) < 2:
                continue

            line = LineString(coords)

            if line.is_empty:
                continue

            projected = transform(
                to_meters.transform,
                line,
            )

            if projected.length <= 0:
                continue

            lines.append(projected)
            source_ids.append(
                properties.get("OBJECTID", "")
            )

    print("Indexed line parts:", len(lines))

    tree = STRtree(lines)

    results = []

    print("Snapping washroom sites...")

    for feature in washrooms:
        props = feature.get("properties") or {}
        lon, lat = feature["geometry"]["coordinates"][:2]

        point = transform(
            to_meters.transform,
            Point(lon, lat),
        )

        nearest_index = int(tree.nearest(point))
        nearest_line = lines[nearest_index]

        distance = point.distance(nearest_line)

        snapped_point = nearest_line.interpolate(
            nearest_line.project(point)
        )

        snap_lon, snap_lat = to_lonlat.transform(
            snapped_point.x,
            snapped_point.y,
        )

        results.append({
            "site_id": props.get("site_id", ""),
            "site_name": props.get("site_name", ""),
            "source": props.get("source", ""),
            "distance_to_nearest_segment_m": round(
                distance, 2
            ),
            "nearest_segment_objectid": source_ids[
                nearest_index
            ],
            "snap_lon": round(snap_lon, 9),
            "snap_lat": round(snap_lat, 9),
            "snap_review_flag": (
                "review"
                if distance > 100
                else "within_100m"
            ),
        })

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with OUTPUT_PATH.open(
        "w",
        newline="",
        encoding="utf-8",
    ) as f:
        writer = csv.DictWriter(
            f,
            fieldnames=list(results[0].keys()),
        )
        writer.writeheader()
        writer.writerows(results)

    distances = [
        r["distance_to_nearest_segment_m"]
        for r in results
    ]

    print("\nSEGMENT SNAP SUMMARY")
    print("-" * 65)

    print("Total sites:", len(results))
    print("Median distance:", round(median(distances), 2), "m")
    print("Maximum distance:", round(max(distances), 2), "m")

    for threshold in [25, 50, 100, 200, 500]:
        count = sum(
            distance <= threshold
            for distance in distances
        )

        print(
            f"Within {threshold} m:",
            count,
            f"({100 * count / len(results):.2f}%)",
        )

    review_count = sum(
        distance > 100
        for distance in distances
    )

    print("\nSites requiring review (>100 m):", review_count)

    print("\n10 FARTHEST SITES")
    print("-" * 65)

    farthest = sorted(
        results,
        key=lambda r: r[
            "distance_to_nearest_segment_m"
        ],
        reverse=True,
    )[:10]

    for result in farthest:
        print(
            f"{result['site_name']} "
            f"[{result['source']}] — "
            f"{result['distance_to_nearest_segment_m']:.2f} m"
        )

    print("\nDiagnostic saved to:")
    print(OUTPUT_PATH)

    print(
        "\nImportant: geometric proximity does not prove "
        "a legal, accessible, or physically usable connection."
    )


if __name__ == "__main__":
    main()

