
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

geod = Geod(ellps="WGS84")


def length_m(a, b):
    return geod.inv(a[0], a[1], b[0], b[1])[2]


def main():
    print("=" * 65)
    print("CIVICACCESS — SNAP-AWARE ROUTING GRAPH")
    print("=" * 65)

    with NETWORK_PATH.open(encoding="utf-8") as f:
        features = json.load(f)["features"]

    with SNAP_PATH.open(encoding="utf-8") as f:
        sites = list(csv.DictReader(f))

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
                        start, end, weight=weight
                    )

    original_nodes = graph.number_of_nodes()
    original_edges = graph.number_of_edges()

    print("\nOriginal nodes:", original_nodes)
    print("Original edges:", original_edges)

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

        # Treat an edge as undirected.
        key = tuple(sorted((start, end)))

        fraction = float(site["edge_fraction"])

        # Reverse the fraction if the CSV edge direction
        # differs from the canonical edge direction.
        if start != key[0]:
            fraction = 1.0 - fraction

        fraction = max(0.0, min(1.0, fraction))

        grouped[key].append((fraction, site))

    split_edges = 0
    inserted_nodes = 0
    endpoint_sites = 0
    missing_edges = 0

    for (start, end), entries in grouped.items():
        if not graph.has_edge(start, end):
            missing_edges += len(entries)
            continue

        original_weight = graph[start][end]["weight"]

        interior = []

        for fraction, site in entries:
            site_id = site["site_id"]

            if fraction <= 1e-8:
                site_nodes[site_id] = start
                endpoint_sites += 1
            elif fraction >= 1.0 - 1e-8:
                site_nodes[site_id] = end
                endpoint_sites += 1
            else:
                interior.append((fraction, site))

        if not interior:
            continue

        interior.sort(key=lambda item: item[0])

        graph.remove_edge(start, end)

        chain = [(0.0, start)]

        # Two facilities at the same position can share
        # the same graph node.
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
                inserted_nodes += 1

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

        split_edges += 1

    print("\nSNAP INSERTION SUMMARY")
    print("-" * 65)
    print("Washroom sites:", len(sites))
    print("Sites assigned graph nodes:", len(site_nodes))
    print("Endpoint assignments:", endpoint_sites)
    print("New snap nodes:", inserted_nodes)
    print("Original edges split:", split_edges)
    print("Sites on missing edges:", missing_edges)

    print("\nUPDATED GRAPH")
    print("-" * 65)
    print("Nodes:", graph.number_of_nodes())
    print("Edges:", graph.number_of_edges())

    components = sorted(
        nx.connected_components(graph),
        key=len,
        reverse=True,
    )

    print("Connected components:", len(components))
    print("Largest component nodes:", len(components[0]))

    print("\nROUTING TEST")
    print("-" * 65)

    component_by_node = {
        node: index
        for index, component in enumerate(components)
        for node in component
    }

    main_sites = [
        site
        for site in sites
        if site["site_id"] in site_nodes
        and component_by_node[site_nodes[site["site_id"]]] == 0
    ]

    if len(main_sites) >= 2:
        first = main_sites[0]
        second = main_sites[1]

        start_node = site_nodes[first["site_id"]]
        end_node = site_nodes[second["site_id"]]

        distance = nx.shortest_path_length(
            graph,
            start_node,
            end_node,
            weight="weight",
        )

        access_a = float(first["distance_to_edge_m"])
        access_b = float(second["distance_to_edge_m"])

        estimated_total = distance + access_a + access_b

        print("Site A:", first["site_name"])
        print("Site B:", second["site_name"])
        print("Network distance:", round(distance, 2), "m")
        print(
            "Estimated access connectors:",
            round(access_a + access_b, 2),
            "m",
        )
        print(
            "Combined estimated distance:",
            round(estimated_total, 2),
            "m",
        )
        print(
            "Estimated time at 80 m/min:",
            round(estimated_total / 80, 2),
            "minutes",
        )

    print("\nVALIDATION")
    print("-" * 65)
    print(
        "All sites assigned:",
        len(site_nodes) == len(sites),
    )
    print(
        "Component count preserved:",
        len(components) == 6,
    )

    print(
        "\nImportant: straight-line access connectors are "
        "hypothetical and may cross barriers. These "
        "results are not verified walking directions."
    )


if __name__ == "__main__":
    main()

