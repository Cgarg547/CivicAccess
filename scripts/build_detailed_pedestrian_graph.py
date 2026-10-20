
import json
from collections import Counter
from pathlib import Path

import networkx as nx
from pyproj import Geod

NETWORK_PATH = Path(
    "data/raw/pedestrians/Pedestrian Network Data - 4326.geojson"
)

geod = Geod(ellps="WGS84")


def segment_length(a, b):
    _, _, distance = geod.inv(
        a[0], a[1], b[0], b[1]
    )
    return distance


def main():
    print("=" * 65)
    print("CIVICACCESS — DETAILED PEDESTRIAN GRAPH")
    print("=" * 65)

    with NETWORK_PATH.open(encoding="utf-8") as f:
        features = json.load(f)["features"]

    graph = nx.Graph()

    processed_edges = 0
    duplicate_edges = 0
    skipped_edges = 0

    for feature in features:
        geometry = feature.get("geometry") or {}

        if geometry.get("type") != "MultiLineString":
            continue

        for line in geometry.get("coordinates") or []:
            for a, b in zip(line, line[1:]):
                start = tuple(a[:2])
                end = tuple(b[:2])

                if start == end:
                    skipped_edges += 1
                    continue

                length = segment_length(start, end)

                processed_edges += 1

                if graph.has_edge(start, end):
                    duplicate_edges += 1

                    if length < graph[start][end]["weight"]:
                        graph[start][end]["weight"] = length
                else:
                    graph.add_edge(
                        start,
                        end,
                        weight=length,
                    )

    components = sorted(
        nx.connected_components(graph),
        key=len,
        reverse=True,
    )

    degrees = Counter(dict(graph.degree()).values())

    print("\nGRAPH SUMMARY")
    print("-" * 65)
    print("Source features:", len(features))
    print("Processed coordinate-pair edges:", processed_edges)
    print("Duplicate edges:", duplicate_edges)
    print("Skipped zero-length edges:", skipped_edges)
    print("Unique graph nodes:", graph.number_of_nodes())
    print("Unique graph edges:", graph.number_of_edges())

    print("\nCONNECTIVITY")
    print("-" * 65)
    print("Connected components:", len(components))

    if components:
        largest = len(components[0])
        total = graph.number_of_nodes()

        print("Largest component nodes:", largest)
        print(
            "Largest component percentage:",
            round(100 * largest / total, 2),
            "%",
        )

        print("\nLargest 10 component sizes:")
        for i, component in enumerate(components[:10], 1):
            print(f"  {i}. {len(component)} nodes")

    print("\nNODE DEGREES")
    print("-" * 65)

    for degree, count in sorted(degrees.items()):
        print(f"Degree {degree}: {count}")

    print("\nDetailed graph construction complete.")
    print(
        "Note: geometric connectivity is not proof "
        "of accessible pedestrian infrastructure."
    )


if __name__ == "__main__":
    main()

