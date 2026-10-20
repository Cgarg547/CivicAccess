
import csv
import json
from collections import defaultdict
from pathlib import Path

import networkx as nx
from pyproj import Geod

NETWORK_PATH = Path(
    "data/raw/pedestrians/Pedestrian Network Data - 4326.geojson"
)

SNAP_PATH = Path(
    "data/processed/washrooms/washroom_detailed_edge_snap.csv"
)

OUTPUT_PATH = Path(
    "data/processed/washrooms/network_access_summary.json"
)

WALKING_SPEED_M_PER_MIN = 80.0
THRESHOLDS_MIN = [5, 10, 15]

geod = Geod(ellps="WGS84")


def length_m(a, b):
    return geod.inv(a[0], a[1], b[0], b[1])[2]


def build_graph(features):
    graph = nx.Graph()

    for feature in features:
        geometry = feature.get("geometry") or {}

        for line in geometry.get("coordinates") or []:
            for a, b in zip(line, line[1:]):
                start = tuple(a[:2])
                end = tuple(b[:2])

                if start == end:
                    continue

                weight = length_m(start, end)

                if (
                    not graph.has_edge(start, end)
                    or weight < graph[start][end]["weight"]
                ):
                    graph.add_edge(
                        start,
                        end,
                        weight=weight,
                    )

    return graph


def insert_snap_nodes(graph, sites):
    grouped = defaultdict(list)
    site_nodes = {}

    for site in sites:
        start = (
            float(site["start_lon"]),
            float(site["start_lat"]),
        )
        end = (
            float(site["end_lon"]),
            float(site["end_lat"]),
        )

        key = tuple(sorted((start, end)))

        fraction = float(site["edge_fraction"])

        if start != key[0]:
            fraction = 1.0 - fraction

        fraction = max(0.0, min(1.0, fraction))

        grouped[key].append((fraction, site))

    for (start, end), entries in grouped.items():
        if not graph.has_edge(start, end):
            raise RuntimeError(
                f"Missing graph edge: {start} -> {end}"
            )

        original_weight = graph[start][end]["weight"]
        interior = []

        for fraction, site in entries:
            site_id = site["site_id"]

            if fraction <= 1e-8:
                site_nodes[site_id] = start
            elif fraction >= 1.0 - 1e-8:
                site_nodes[site_id] = end
            else:
                interior.append((fraction, site))

        if not interior:
            continue

        interior.sort(key=lambda item: item[0])
        graph.remove_edge(start, end)

        chain = [(0.0, start)]

        for fraction, site in interior:
            if (
                len(chain) > 1
                and abs(fraction - chain[-1][0]) < 1e-8
            ):
                node = chain[-1][1]
            else:
                node = (
                    "snap",
                    start,
                    end,
                    round(fraction, 10),
                )
                chain.append((fraction, node))

            site_nodes[site["site_id"]] = node

        chain.append((1.0, end))

        for (fraction_a, node_a), (
            fraction_b, node_b
        ) in zip(chain, chain[1:]):
            graph.add_edge(
                node_a,
                node_b,
                weight=original_weight * (
                    fraction_b - fraction_a
                ),
            )

    if len(site_nodes) != len(sites):
        raise RuntimeError(
            "Not every washroom received a graph node."
        )

    return site_nodes


def main():
    print("=" * 65)
    print("CIVICACCESS — NETWORK WASHROOM ACCESS ANALYSIS")
    print("=" * 65)

    with NETWORK_PATH.open(encoding="utf-8") as f:
        features = json.load(f)["features"]

    with SNAP_PATH.open(encoding="utf-8") as f:
        sites = list(csv.DictReader(f))

    print("\nBuilding detailed network...")
    graph = build_graph(features)

    print("Inserting washroom snap points...")
    site_nodes = insert_snap_nodes(graph, sites)

    original_node_count = graph.number_of_nodes()

    # Add a super-source with the estimated facility
    # access distance as the initial cost.
    super_source = ("civicaccess", "super_source")

    graph.add_node(super_source)

    for site in sites:
        site_node = site_nodes[site["site_id"]]
        access_distance = float(
            site["distance_to_edge_m"]
        )

        if graph.has_edge(super_source, site_node):
            graph[super_source][site_node]["weight"] = min(
                graph[super_source][site_node]["weight"],
                access_distance,
            )
        else:
            graph.add_edge(
                super_source,
                site_node,
                weight=access_distance,
            )

    print("Running multi-source distance calculation...")

    distances = nx.single_source_dijkstra_path_length(
        graph,
        super_source,
        weight="weight",
    )

    distances.pop(super_source, None)

    print("\nRESULTS")
    print("-" * 65)

    print("Network nodes:", original_node_count)
    print("Reachable nodes:", len(distances))

    summary = {
        "method": "multi_source_dijkstra",
        "model_status": "preliminary",
        "walking_speed_m_per_min": WALKING_SPEED_M_PER_MIN,
        "source_site_count": len(sites),
        "network_node_count": original_node_count,
        "reachable_node_count": len(distances),
        "thresholds": {},
        "limitations": [
            "All source network segments are currently permitted.",
            "Facility-to-network connectors are hypothetical.",
            "Sidewalk and crossing restrictions are not validated.",
            "Ferry travel is not included.",
            "Node percentages do not represent population coverage.",
            "Recorded facilities are not guaranteed to be open.",
        ],
    }

    for minutes in THRESHOLDS_MIN:
        threshold_m = minutes * WALKING_SPEED_M_PER_MIN

        count = sum(
            distance <= threshold_m
            for distance in distances.values()
        )

        percentage = (
            100 * count / original_node_count
        )

        print(
            f"Within {minutes} minutes "
            f"({threshold_m:.0f} m): "
            f"{count} nodes ({percentage:.2f}%)"
        )

        summary["thresholds"][str(minutes)] = {
            "distance_m": threshold_m,
            "reachable_nodes": count,
            "percentage_of_network_nodes": round(
                percentage, 2
            ),
        }

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\nSaved:")
    print(OUTPUT_PATH)

    print(
        "\nThese are graph-node coverage statistics, "
        "not neighbourhood, geographic-area, or "
        "population coverage estimates."
    )


if __name__ == "__main__":
    main()

