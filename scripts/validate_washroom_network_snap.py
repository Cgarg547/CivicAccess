
import json
from pathlib import Path
from statistics import median

import numpy as np
from pyproj import Transformer
from scipy.spatial import cKDTree

NETWORK_PATH = Path(
    "data/raw/pedestrians/Pedestrian Network Data - 4326.geojson"
)

WASHROOM_PATH = Path(
    "data/processed/washrooms/washroom_sites_enriched.geojson"
)

OUTPUT_PATH = Path(
    "data/processed/washrooms/washroom_network_snap_diagnostic.csv"
)


def main():
    print("=" * 65)
    print("CIVICACCESS — WASHROOM NETWORK SNAP DIAGNOSTIC")
    print("=" * 65)

    with NETWORK_PATH.open(encoding="utf-8") as f:
        network = json.load(f)["features"]

    with WASHROOM_PATH.open(encoding="utf-8") as f:
        washrooms = json.load(f)["features"]

    # Toronto lies within UTM zone 17N.
    # EPSG:26917 uses metre-based projected coordinates.
    transformer = Transformer.from_crs(
        "EPSG:4326",
        "EPSG:26917",
        always_xy=True,
    )

    nodes = set()

    for feature in network:
        geometry = feature.get("geometry") or {}

        for line in geometry.get("coordinates") or []:
            if len(line) >= 2:
                nodes.add(tuple(line[0][:2]))
                nodes.add(tuple(line[-1][:2]))

    node_list = sorted(nodes)

    node_lon = np.array([p[0] for p in node_list])
    node_lat = np.array([p[1] for p in node_list])

    node_x, node_y = transformer.transform(node_lon, node_lat)

    node_xy = np.column_stack([node_x, node_y])

    tree = cKDTree(node_xy)

    site_ids = []
    site_names = []
    site_sources = []
    site_coordinates = []

    for feature in washrooms:
        props = feature.get("properties") or {}
        coords = feature["geometry"]["coordinates"]

        site_ids.append(props.get("site_id", ""))
        site_names.append(props.get("site_name", ""))
        site_sources.append(props.get("source", ""))
        site_coordinates.append(coords[:2])

    site_coordinates = np.asarray(site_coordinates)

    site_x, site_y = transformer.transform(
        site_coordinates[:, 0],
        site_coordinates[:, 1],
    )

    site_xy = np.column_stack([site_x, site_y])

    distances, nearest_indices = tree.query(site_xy)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    import csv

    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        writer.writerow([
            "site_id",
            "site_name",
            "source",
            "distance_to_nearest_node_m",
            "nearest_node_lon",
            "nearest_node_lat",
            "snap_review_flag",
        ])

        for i, distance in enumerate(distances):
            nearest = node_list[int(nearest_indices[i])]

            flag = (
                "review"
                if distance > 100
                else "within_100m"
            )

            writer.writerow([
                site_ids[i],
                site_names[i],
                site_sources[i],
                round(float(distance), 2),
                nearest[0],
                nearest[1],
                flag,
            ])

    print("\nSITE SNAP SUMMARY")
    print("-" * 65)
    print("Total sites:", len(washrooms))
    print("Nearest-node median:", round(median(distances), 2), "m")
    print("Nearest-node maximum:", round(max(distances), 2), "m")

    for threshold in [25, 50, 100, 200, 500]:
        count = int(np.sum(distances <= threshold))

        print(
            f"Within {threshold} m:",
            count,
            f"({100 * count / len(distances):.2f}%)",
        )

    review_count = int(np.sum(distances > 100))

    print("\nSites requiring review (>100 m):", review_count)

    print("\n10 FARTHEST SITES")
    print("-" * 65)

    farthest = np.argsort(distances)[-10:][::-1]

    for index in farthest:
        print(
            f"{site_names[index]} "
            f"[{site_sources[index]}] — "
            f"{distances[index]:.2f} m"
        )

    print("\nDiagnostic saved to:")
    print(OUTPUT_PATH)

    print(
        "\nImportant: nearest-node distance is a geometric "
        "diagnostic, not a verified walkable connection."
    )


if __name__ == "__main__":
    main()

