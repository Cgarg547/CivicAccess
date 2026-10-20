
import json
from collections import Counter
from pathlib import Path

import networkx as nx

INPUT = Path(
    "data/raw/pedestrians/Pedestrian Network Data - 4326.geojson"
)


def node_key(coordinate):
    """Use original longitude/latitude coordinates as graph node IDs."""
    return (float(coordinate[0]), float(coordinate[1]))


def main():
    print("=" * 60)
    print("CIVICACCESS PEDESTRIAN NETWORK — INITIAL TOPOLOGY CHECK")
    print("=" * 60)

    print("\nLoading pedestrian network...")

    with INPUT.open(encoding="utf-8") as f:
        features = json.load(f)["features"]

    graph = nx.Graph()

    skipped_parts = 0
    parts_processed = 0

    for feature in features:
        geometry = feature.get("geometry") or {}
        properties = feature.get("properties") or {}

        if geometry.get("type") != "MultiLineString":
            continue

        lines = geometry.get("coordinates") or []
        feature_length = float(properties["LENGTH"])

        # Each part becomes an edge between its endpoints.
        # This is a topology diagnostic, not the final routing graph.
        for line in lines:
            if len(line) < 2:
                skipped_parts += 1
                continue

            start = node_key(line[0])
            end = node_key(line[-1])

            if start == end:
                skipped_parts += 1
                continue

            parts_processed += 1

            # A feature may contain multiple line parts. Its total
            # LENGTH must not be assigned to every part.
            # Use geodesic length for accurate per-part weights.
            from pyproj import Geod

            geod = Geod(ellps="WGS84")
            length_m = 0.0

            for a, b in zip(line, line[1:]):
                _, _, distance = geod.inv(
                    a[0], a[1], b[0], b[1]
                )
                length_m += distance

            if graph.has_edge(start, end):
                if length_m < graph[start][end]["length_m"]:
                    graph[start][end]["length_m"] = length_m
            else:
                graph.add_edge(
                    start,
                    end,
                    length_m=length_m,
                )

    print("\nGRAPH SUMMARY")
    print("-" * 60)
    print("Source features:", len(features))
    print("Line parts processed:", parts_processed)
    print("Skipped parts:", skipped_parts)
    print("Graph nodes:", graph.number_of_nodes())
    print("Graph edges:", graph.number_of_edges())

    print("\nAnalyzing connected components...")

    components = sorted(
        nx.connected_components(graph),
        key=len,
        reverse=True,
    )

    print("Connected components:", len(components))

    if components:
        largest = components[0]

        print("Largest component nodes:", len(largest))
        print(
            "Largest component percentage:",
            round(
                100 * len(largest) / graph.number_of_nodes(),
                2,
            ),
            "%",
        )

        print("\nLargest 10 component sizes:")
        for index, component in enumerate(components[:10], 1):
            print(f"  {index}. {len(component)} nodes")

    degrees = Counter(dict(graph.degree()).values())

    print("\nNODE DEGREE DISTRIBUTION")
    print("-" * 60)

    for degree, count in sorted(degrees.items()):
        print(f"Degree {degree}: {count} nodes")

    print("\nInitial topology inspection complete.")
    print(
        "Note: Endpoint connectivity alone does not establish "
        "real-world pedestrian accessibility."
    )


if __name__ == "__main__":
    main()

