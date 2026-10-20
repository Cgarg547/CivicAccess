
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

import networkx as nx

NETWORK_PATH = Path(
    "data/raw/pedestrians/Pedestrian Network Data - 4326.geojson"
)

SNAP_PATH = Path(
    "data/processed/washrooms/washroom_detailed_edge_snap.csv"
)

SUMMARY_PATH = Path(
    "data/processed/washrooms/network_access_summary.json"
)


def main():
    print("=" * 65)
    print("CIVICACCESS — NETWORK COMPONENT VALIDATION")
    print("=" * 65)

    with NETWORK_PATH.open(encoding="utf-8") as f:
        features = json.load(f)["features"]

    with SNAP_PATH.open(encoding="utf-8") as f:
        sites = list(csv.DictReader(f))

    with SUMMARY_PATH.open(encoding="utf-8") as f:
        summary = json.load(f)

    graph = nx.Graph()

    for feature in features:
        geometry = feature.get("geometry") or {}

        for line in geometry.get("coordinates") or []:
            for a, b in zip(line, line[1:]):
                start = tuple(a[:2])
                end = tuple(b[:2])

                if start != end:
                    graph.add_edge(start, end)

    components = sorted(
        nx.connected_components(graph),
        key=len,
        reverse=True,
    )

    component_by_node = {
        node: index
        for index, component in enumerate(components)
        for node in component
    }

    sites_by_component = Counter()
    names_by_component = defaultdict(list)
    unmatched_sites = []

    for site in sites:
        start = (
            float(site["start_lon"]),
            float(site["start_lat"]),
        )

        component_id = component_by_node.get(start)

        if component_id is None:
            unmatched_sites.append(site["site_name"])
            continue

        sites_by_component[component_id] += 1
        names_by_component[component_id].append(
            site["site_name"]
        )

    print("\nCOMPONENT SUMMARY")
    print("-" * 65)

    unreachable_nodes = 0

    for index, component in enumerate(components):
        node_count = len(component)
        site_count = sites_by_component[index]

        print(
            f"Component {index}: "
            f"{node_count} nodes, "
            f"{site_count} washroom sites"
        )

        if site_count == 0:
            unreachable_nodes += node_count

    expected_unreachable = (
        summary["network_node_count"]
        - summary["reachable_node_count"]
    )

    print("\nVALIDATION")
    print("-" * 65)

    print("Total components:", len(components))
    print("Washroom sites:", len(sites))
    print("Matched washroom sites:", sum(sites_by_component.values()))
    print("Unmatched washroom sites:", len(unmatched_sites))

    print(
        "Nodes in components without washrooms:",
        unreachable_nodes,
    )

    print(
        "Unreachable nodes from saved analysis:",
        expected_unreachable,
    )

    print(
        "Counts match:",
        unreachable_nodes == expected_unreachable,
    )

    if unmatched_sites:
        print("\nUNMATCHED SITES")
        for name in unmatched_sites:
            print(" -", name)

    print("\nSMALL COMPONENT SITE DETAILS")
    print("-" * 65)

    for component_id in range(1, len(components)):
        names = names_by_component[component_id]

        if names:
            print(f"\nComponent {component_id}:")
            for name in names:
                print(" -", name)

    assert not unmatched_sites, (
        "Some washroom snap edges were not found."
    )

    assert unreachable_nodes == expected_unreachable, (
        "Unreachable-node count does not match "
        "the saved network analysis."
    )

    print("\nComponent validation passed.")


if __name__ == "__main__":
    main()

