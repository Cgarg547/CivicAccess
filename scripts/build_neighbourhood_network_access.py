
import csv
import json
from collections import defaultdict
from pathlib import Path

import networkx as nx
from pyproj import Geod
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

NETWORK_PATH = Path(
    "data/raw/pedestrians/Pedestrian Network Data - 4326.geojson"
)

SNAP_PATH = Path(
    "data/processed/washrooms/washroom_detailed_edge_snap.csv"
)

NEIGHBOURHOOD_PATH = Path(
    "data/processed/neighbourhoods/neighbourhood_population_coverage.geojson"
)

OUTPUT_PATH = Path(
    "data/processed/neighbourhoods/neighbourhood_network_access.geojson"
)

WALKING_SPEED_M_PER_MIN = 80
THRESHOLDS = [5, 10, 15]

geod = Geod(ellps="WGS84")


def distance_m(a, b):
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

                length = distance_m(start, end)

                if (
                    not graph.has_edge(start, end)
                    or length < graph[start][end]["weight"]
                ):
                    graph.add_edge(
                        start, end, weight=length
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

        weight = graph[start][end]["weight"]
        interior = []

        for fraction, site in entries:
            if fraction <= 1e-8:
                site_nodes[site["site_id"]] = start
            elif fraction >= 1 - 1e-8:
                site_nodes[site["site_id"]] = end
            else:
                interior.append((fraction, site))

        if not interior:
            continue

        interior.sort(key=lambda x: x[0])
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

        for (fa, na), (fb, nb) in zip(
            chain, chain[1:]
        ):
            graph.add_edge(
                na,
                nb,
                weight=weight * (fb - fa),
            )

    if len(site_nodes) != len(sites):
        raise RuntimeError(
            "Not all washrooms received graph nodes."
        )

    return site_nodes


def main():
    print("=" * 65)
    print("CIVICACCESS — NEIGHBOURHOOD NETWORK ACCESS")
    print("=" * 65)

    with NETWORK_PATH.open(encoding="utf-8") as f:
        network = json.load(f)["features"]

    with SNAP_PATH.open(encoding="utf-8") as f:
        sites = list(csv.DictReader(f))

    with NEIGHBOURHOOD_PATH.open(encoding="utf-8") as f:
        neighbourhood_data = json.load(f)

    features = neighbourhood_data["features"]

    print("\nBuilding routing graph...")
    graph = build_graph(network)

    print("Inserting washroom snap positions...")
    site_nodes = insert_snap_nodes(graph, sites)

    # Preserve original network nodes for neighbourhood
    # assignment; snap nodes are synthetic tuples.
    geographic_nodes = [
        node
        for node in graph.nodes
        if (
            isinstance(node, tuple)
            and len(node) == 2
            and all(isinstance(v, float) for v in node)
        )
    ]

    print("Geographic nodes:", len(geographic_nodes))

    super_source = ("civicaccess", "super_source")

    for site in sites:
        node = site_nodes[site["site_id"]]
        access = float(site["distance_to_edge_m"])

        if graph.has_edge(super_source, node):
            graph[super_source][node]["weight"] = min(
                graph[super_source][node]["weight"],
                access,
            )
        else:
            graph.add_edge(
                super_source,
                node,
                weight=access,
            )

    print("Calculating nearest-washroom distances...")

    distances = nx.single_source_dijkstra_path_length(
        graph,
        super_source,
        weight="weight",
    )

    polygons = [
        shape(feature["geometry"])
        for feature in features
    ]

    tree = STRtree(polygons)

    counts = defaultdict(lambda: {
        "total": 0,
        "5": 0,
        "10": 0,
        "15": 0,
    })

    unmatched_nodes = 0

    print("Assigning network nodes to neighbourhoods...")

    for node in geographic_nodes:
        point = Point(node)

        candidates = tree.query(point)

        matched = None

        for index in candidates:
            index = int(index)

            if polygons[index].covers(point):
                matched = index
                break

        if matched is None:
            unmatched_nodes += 1
            continue

        record = counts[matched]
        record["total"] += 1

        distance = distances.get(node, float("inf"))

        for minutes in THRESHOLDS:
            if distance <= minutes * WALKING_SPEED_M_PER_MIN:
                record[str(minutes)] += 1

    for index, feature in enumerate(features):
        record = counts[index]
        total = record["total"]

        props = feature["properties"]

        props["network_node_count"] = total

        for minutes in THRESHOLDS:
            count = record[str(minutes)]

            props[
                f"network_nodes_within_{minutes}min"
            ] = count

            props[
                f"network_node_coverage_{minutes}min_pct"
            ] = (
                round(100 * count / total, 2)
                if total > 0
                else None
            )

        props["network_access_method"] = (
            "Preliminary node-based pedestrian network "
            "distance, 80 metres/minute"
        )

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(neighbourhood_data, f)

    print("\nRESULTS")
    print("-" * 65)

    print("Neighbourhoods:", len(features))
    print("Assigned network nodes:", sum(
        record["total"] for record in counts.values()
    ))
    print("Unmatched network nodes:", unmatched_nodes)

    for minutes in THRESHOLDS:
        key = f"network_node_coverage_{minutes}min_pct"

        values = [
            feature["properties"][key]
            for feature in features
            if feature["properties"][key] is not None
        ]

        print(
            f"{minutes}-minute neighbourhood coverage "
            f"range: {min(values):.2f}%–{max(values):.2f}%"
        )

    print("\nSaved:")
    print(OUTPUT_PATH)

    print(
        "\nCaution: these percentages describe graph "
        "nodes, not residents or land area."
    )


if __name__ == "__main__":
    main()

