
import csv
import json
from pathlib import Path
from statistics import median

from pyproj import Transformer
from shapely.geometry import LineString, Point
from shapely.strtree import STRtree

NETWORK_PATH = Path(
    "data/raw/pedestrians/Pedestrian Network Data - 4326.geojson"
)

WASHROOM_PATH = Path(
    "data/processed/washrooms/washroom_sites_enriched.geojson"
)

OUTPUT_PATH = Path(
    "data/processed/washrooms/washroom_detailed_edge_snap.csv"
)


def main():
    print("=" * 65)
    print("CIVICACCESS — DETAILED EDGE SNAP VALIDATION")
    print("=" * 65)

    with NETWORK_PATH.open(encoding="utf-8") as f:
        network = json.load(f)["features"]

    with WASHROOM_PATH.open(encoding="utf-8") as f:
        washrooms = json.load(f)["features"]

    to_meters = Transformer.from_crs(
        "EPSG:4326", "EPSG:26917", always_xy=True
    )

    to_lonlat = Transformer.from_crs(
        "EPSG:26917", "EPSG:4326", always_xy=True
    )

    edges = []
    edge_metadata = []

    print("\nBuilding coordinate-pair edge index...")

    for feature in network:
        props = feature.get("properties") or {}
        geometry = feature.get("geometry") or {}

        for line in geometry.get("coordinates") or []:
            for a, b in zip(line, line[1:]):
                start = tuple(a[:2])
                end = tuple(b[:2])

                if start == end:
                    continue

                ax, ay = to_meters.transform(*start)
                bx, by = to_meters.transform(*end)

                segment = LineString([
                    (ax, ay),
                    (bx, by),
                ])

                if segment.length <= 0:
                    continue

                edges.append(segment)
                edge_metadata.append({
                    "start": start,
                    "end": end,
                    "object_id": props.get("OBJECTID", ""),
                    "road_type": props.get("ROAD_TYPE", ""),
                    "sidewalk": props.get(
                        "SIDEWALK_DESCRIPTION", ""
                    ),
                })

    tree = STRtree(edges)

    print("Indexed coordinate-pair edges:", len(edges))

    results = []

    print("Snapping washrooms to detailed edges...")

    for feature in washrooms:
        props = feature.get("properties") or {}
        lon, lat = feature["geometry"]["coordinates"][:2]

        x, y = to_meters.transform(lon, lat)
        site_point = Point(x, y)

        edge_index = int(tree.nearest(site_point))
        edge = edges[edge_index]
        metadata = edge_metadata[edge_index]

        position_m = edge.project(site_point)
        snapped_point = edge.interpolate(position_m)

        snap_lon, snap_lat = to_lonlat.transform(
            snapped_point.x,
            snapped_point.y,
        )

        distance_m = site_point.distance(snapped_point)

        results.append({
            "site_id": props.get("site_id", ""),
            "site_name": props.get("site_name", ""),
            "source": props.get("source", ""),
            "distance_to_edge_m": round(distance_m, 3),
            "edge_position_m": round(position_m, 3),
            "edge_length_m": round(edge.length, 3),
            "edge_fraction": round(
                position_m / edge.length, 8
            ),
            "start_lon": metadata["start"][0],
            "start_lat": metadata["start"][1],
            "end_lon": metadata["end"][0],
            "end_lat": metadata["end"][1],
            "snap_lon": round(snap_lon, 9),
            "snap_lat": round(snap_lat, 9),
            "object_id": metadata["object_id"],
            "road_type": metadata["road_type"],
            "sidewalk_description": metadata["sidewalk"],
        })

    OUTPUT_PATH.parent.mkdir(
        parents=True, exist_ok=True
    )

    with OUTPUT_PATH.open(
        "w", newline="", encoding="utf-8"
    ) as f:
        writer = csv.DictWriter(
            f,
            fieldnames=list(results[0].keys()),
        )
        writer.writeheader()
        writer.writerows(results)

    distances = [
        row["distance_to_edge_m"]
        for row in results
    ]

    print("\nSNAP SUMMARY")
    print("-" * 65)
    print("Sites:", len(results))
    print("Median distance:", round(median(distances), 2), "m")
    print("Maximum distance:", round(max(distances), 2), "m")

    for threshold in [25, 50, 100, 200]:
        count = sum(d <= threshold for d in distances)
        print(
            f"Within {threshold} m:",
            count,
            f"({100 * count / len(distances):.2f}%)",
        )

    interior = sum(
        0 < row["edge_fraction"] < 1
        for row in results
    )

    print("\nInterior edge snap points:", interior)
    print("Endpoint snap points:", len(results) - interior)

    print("\nOutput:")
    print(OUTPUT_PATH)

    print(
        "\nNote: edge proximity is not evidence of "
        "an accessible pedestrian connection."
    )


if __name__ == "__main__":
    main()

