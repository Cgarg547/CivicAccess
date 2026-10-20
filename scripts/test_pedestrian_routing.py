
import csv
import json
from pathlib import Path

import networkx as nx
from pyproj import Geod

NETWORK_PATH = Path(
    "data/raw/pedestrians/Pedestrian Network Data - 4326.geojson"
)

SNAP_PATH = Path(
    "data/processed/washrooms/washroom_segment_snap_diagnostic.csv"
)

geod = Geod(ellps="WGS84")


def line_length_m(coords):
    total = 0.0

    for a, b in zip(coords, coords[1:]):
        _, _, distance = geod.inv(
            a[0], a[1], b[0], b[1]
        )
        total += distance

    return total


def build_graph(features):
    graph = nx.Graph()
    segment_endpoints = {}

    for feature in features:
        props = feature.get("properties") or {}
        object_id = str(props.get("OBJECTID", ""))

        for coords in feature["geometry"].get(
            "coordinates", []
        ):
            if len(coords) < 2:
                continue

            start = tuple(coords[0][:2])
            end = tuple(coords[-1][:2])

            if start == end:
                continue

            length = line_length_m(coords)

            if graph.has_edge(start, end):
                graph[start][end]["weight"] = min(
                    graph[start][end]["weight"],
                    length,
                )
            else:
                graph.add_edge(
                    start,
                    end,
                    weight=length,
                )

            segment_endpoints[object_id] = (
                start,
                end,
            )

    return graph, segment_endpoints


def main():
    print("=" * 65)
    print("CIVICACCESS — FIRST NETWORK ROUTING TEST")
    print("=" * 65)

    with NETWORK_PATH.open(encoding="utf-8") as f:
        features = json.load(f)["features"]

    graph, segment_endpoints = build_graph(features)

    with SNAP_PATH.open(encoding="utf-8") as f:
        sites = list(csv.DictReader(f))

    # Choose two mainland sites whose snapped segments
    # belong to the same connected component.
    component_by_node = {}

    for component_id, component in enumerate(
        sorted(
            nx.connected_components(graph),
            key=len,
            reverse=True,
        )
    ):
        for node in component:
            component_by_node[node] = component_id

    candidates = []

    for site in sites:
        object_id = site["nearest_segment_objectid"]
        endpoints = segment_endpoints.get(object_id)

        if endpoints is None:
            continue

        if component_by_node[endpoints[0]] == 0:
            candidates.append((site, endpoints))

    if len(candidates) < 2:
        raise RuntimeError(
            "Not enough sites on the main component."
        )

    first_site, first_endpoints = candidates[0]
    second_site, second_endpoints = candidates[1]

    # Preliminary approximation: route between the
    # first endpoints of the snapped segments.
    start = first_endpoints[0]
    end = second_endpoints[0]

    network_distance = nx.shortest_path_length(
        graph,
        source=start,
        target=end,
        weight="weight",
    )

    _, _, straight_distance = geod.inv(
        start[0],
        start[1],
        end[0],
        end[1],
    )

    walking_speed_m_per_min = 80.0

    estimated_minutes = (
        network_distance / walking_speed_m_per_min
    )

    print("\nTEST SITES")
    print("-" * 65)
    print("Site A:", first_site["site_name"])
    print("Site B:", second_site["site_name"])

    print("\nPRELIMINARY NETWORK RESULTS")
    print("-" * 65)
    print(
        "Graph distance:",
        round(network_distance, 2),
        "m",
    )
    print(
        "Straight-line endpoint distance:",
        round(straight_distance, 2),
        "m",
    )
    print(
        "Estimated walking time:",
        round(estimated_minutes, 2),
        "minutes",
    )

    print("\nASSUMPTIONS")
    print("-" * 65)
    print("Walking speed: 80 metres/minute")
    print("All graph segments currently permitted")
    print("Routing uses snapped-segment endpoints")
    print("Facility-to-network access distance excluded")
    print("Ferry travel excluded")
    print("Crossing restrictions not yet modeled")

    print("\nRouting prototype test complete.")


if __name__ == "__main__":
    main()

