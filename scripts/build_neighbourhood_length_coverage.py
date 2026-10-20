
import csv
import json
import math
from collections import defaultdict
from pathlib import Path

import networkx as nx
from pyproj import Geod, Transformer
from shapely.geometry import LineString, shape
from shapely.ops import transform
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
    "data/processed/neighbourhoods/neighbourhood_network_length_coverage.geojson"
)

SPEED_M_PER_MIN = 80.0
THRESHOLDS = [5, 10, 15]
GEOD = Geod(ellps="WGS84")

TO_METERS = Transformer.from_crs(
    "EPSG:4326", "EPSG:26917", always_xy=True
)
PROJECT = lambda geom: transform(
    TO_METERS.transform, geom
)


def geodesic_length(a, b):
    return GEOD.inv(a[0], a[1], b[0], b[1])[2]


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

                weight = geodesic_length(start, end)

                if (
                    not graph.has_edge(start, end)
                    or weight < graph[start][end]["weight"]
                ):
                    graph.add_edge(
                        start, end, weight=weight
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
            raise RuntimeError("Missing snap edge")

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
        raise RuntimeError("Incomplete site assignment")

    return site_nodes


def covered_intervals(length, da, db, threshold):
    intervals = []

    if math.isfinite(da):
        end = min(length, threshold - da)
        if end > 0:
            intervals.append((0.0, end))

    if math.isfinite(db):
        start = max(0.0, length - (threshold - db))
        if start < length:
            intervals.append((start, length))

    if len(intervals) == 2:
        if intervals[0][1] >= intervals[1][0]:
            return [(0.0, length)]

    return intervals


def line_intersection_length(geometry):
    if geometry.is_empty:
        return 0.0
    return geometry.length


def main():
    print("=" * 65)
    print("CIVICACCESS — NETWORK LENGTH COVERAGE")
    print("=" * 65)

    with NETWORK_PATH.open(encoding="utf-8") as f:
        network = json.load(f)["features"]

    with SNAP_PATH.open(encoding="utf-8") as f:
        sites = list(csv.DictReader(f))

    with NEIGHBOURHOOD_PATH.open(encoding="utf-8") as f:
        neighbourhoods = json.load(f)

    print("\nBuilding snap-aware graph...")
    graph = build_graph(network)
    site_nodes = insert_snap_nodes(graph, sites)

    source = ("civicaccess", "super_source")

    for site in sites:
        node = site_nodes[site["site_id"]]
        access = float(site["distance_to_edge_m"])

        if graph.has_edge(source, node):
            graph[source][node]["weight"] = min(
                graph[source][node]["weight"],
                access,
            )
        else:
            graph.add_edge(
                source, node, weight=access
            )

    print("Calculating shortest-path distances...")
    distances = nx.single_source_dijkstra_path_length(
        graph, source, weight="weight"
    )

    graph.remove_node(source)

    features = neighbourhoods["features"]

    print("Projecting neighbourhood polygons...")
    polygons = [
        PROJECT(shape(feature["geometry"]))
        for feature in features
    ]
    tree = STRtree(polygons)

    results = [
        {
            "total_m": 0.0,
            "covered_m": {
                minutes: 0.0
                for minutes in THRESHOLDS
            },
        }
        for _ in features
    ]

    print("Calculating edge coverage by neighbourhood...")

    edge_count = 0

    for a, b, data in graph.edges(data=True):
        length = data["weight"]

        if length <= 0:
            continue

        # Synthetic snap nodes are represented by
        # projected positions interpolated along their
        # original coordinate-pair edge.
        def coordinate(node):
            if (
                isinstance(node, tuple)
                and len(node) == 4
                and node[0] == "snap"
            ):
                _, start, end, fraction = node
                return (
                    start[0] + (end[0] - start[0]) * fraction,
                    start[1] + (end[1] - start[1]) * fraction,
                )
            return node

        pa = coordinate(a)
        pb = coordinate(b)

        ax, ay = TO_METERS.transform(*pa)
        bx, by = TO_METERS.transform(*pb)

        line = LineString([(ax, ay), (bx, by)])

        if line.length <= 0:
            continue

        da = distances.get(a, float("inf"))
        db = distances.get(b, float("inf"))

        candidate_indices = tree.query(line)

        if len(candidate_indices) == 0:
            continue

        covered_lines = {}

        for minutes in THRESHOLDS:
            threshold = minutes * SPEED_M_PER_MIN
            intervals = covered_intervals(
                length, da, db, threshold
            )

            pieces = []

            for start_m, end_m in intervals:
                # Convert routing-distance positions
                # into fractions of the geometric line.
                start_fraction = start_m / length
                end_fraction = end_m / length

                p1 = line.interpolate(
                    start_fraction * line.length
                )
                p2 = line.interpolate(
                    end_fraction * line.length
                )

                if p1.distance(p2) > 0:
                    pieces.append(LineString([p1, p2]))

            covered_lines[minutes] = pieces

        for raw_index in candidate_indices:
            index = int(raw_index)
            polygon = polygons[index]

            intersection = line.intersection(polygon)
            inside_m = line_intersection_length(
                intersection
            )

            if inside_m <= 0:
                continue

            results[index]["total_m"] += inside_m

            for minutes in THRESHOLDS:
                for piece in covered_lines[minutes]:
                    covered_inside = piece.intersection(
                        polygon
                    ).length

                    results[index]["covered_m"][
                        minutes
                    ] += covered_inside

        edge_count += 1

        if edge_count % 20000 == 0:
            print("  Processed edges:", edge_count)

    print("\nWriting neighbourhood results...")

    for index, feature in enumerate(features):
        record = results[index]
        props = feature["properties"]

        total = record["total_m"]

        props["network_length_km"] = round(
            total / 1000, 3
        )

        for minutes in THRESHOLDS:
            covered = record["covered_m"][minutes]

            props[
                f"network_length_within_{minutes}min_km"
            ] = round(covered / 1000, 3)

            props[
                f"network_length_coverage_{minutes}min_pct"
            ] = (
                round(100 * covered / total, 2)
                if total > 0
                else None
            )

        props["network_length_method"] = (
            "Preliminary snap-aware network distance; "
            "partial edges clipped to neighbourhoods; "
            "80 metres/minute"
        )

    OUTPUT_PATH.parent.mkdir(
        parents=True, exist_ok=True
    )

    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(neighbourhoods, f)

    print("\nRESULTS")
    print("-" * 65)
    print("Neighbourhoods:", len(features))
    print("Graph edges processed:", edge_count)

    total_km = sum(
        record["total_m"] for record in results
    ) / 1000

    print(
        "Total assigned network length:",
        round(total_km, 2),
        "km"
    )

    for minutes in THRESHOLDS:
        covered_km = sum(
            record["covered_m"][minutes]
            for record in results
        ) / 1000

        print(
            f"{minutes}-minute covered network:",
            round(covered_km, 2),
            "km"
        )

    print("\nSaved:", OUTPUT_PATH)

    print(
        "\nCaution: mapped network length is not "
        "population coverage or verified accessibility."
    )


if __name__ == "__main__":
    main()

