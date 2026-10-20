import json
from pathlib import Path

import folium
import networkx as nx
from pyproj import Transformer
from scipy.spatial import cKDTree

network_path = Path(
    "data/raw/pedestrians/Pedestrian Network Data - 4326.geojson"
)
output = Path(
    "data/processed/component_gap_audit_local.html"
)

print("Loading pedestrian network...")
with network_path.open(encoding="utf-8") as f:
    features = json.load(f)["features"]

graph = nx.Graph()

for feature in features:
    geometry = feature.get("geometry") or {}
    for line in geometry.get("coordinates") or []:
        for a, b in zip(line, line[1:]):
            u = (float(a[0]), float(a[1]))
            v = (float(b[0]), float(b[1]))
            if u != v:
                graph.add_edge(u, v)

components = sorted(
    nx.connected_components(graph),
    key=len,
    reverse=True,
)

main_component = components[0]
# Identify the Toronto Islands component geographically.
# Avoid depending on its exact number of nodes.
def is_island_component(component):
    if len(component) < 50:
        return False

    mean_lon = sum(node[0] for node in component) / len(component)
    mean_lat = sum(node[1] for node in component) / len(component)

    return (
        -79.45 < mean_lon < -79.30
        and 43.60 < mean_lat < 43.65
    )


island_components = [
    component
    for component in components
    if is_island_component(component)
]

if len(island_components) != 1:
    raise RuntimeError(
        "Expected exactly one Toronto Islands network component; "
        f"found {len(island_components)}."
    )

small_component = island_components[0]

project = Transformer.from_crs(
    "EPSG:4326", "EPSG:26917", always_xy=True
)

def xy(node):
    return project.transform(node[0], node[1])

main_nodes = list(main_component)
small_nodes = list(small_component)

main_xy = [xy(n) for n in main_nodes]
small_xy = [xy(n) for n in small_nodes]

tree = cKDTree(main_xy)
distances, indices = tree.query(small_xy, k=1)
i = distances.argmin()

small_anchor = small_nodes[i]
main_anchor = main_nodes[int(indices[i])]
gap_m = float(distances[i])

print(f"Main component: {len(main_component):,} nodes")
print(f"Disconnected component: {len(small_component):,} nodes")
print(f"Straight-line gap: {gap_m:.3f} m")

# Keep only local network edges around the gap.
radius_m = 450
anchors = [xy(small_anchor), xy(main_anchor)]

def near_anchor(node):
    x, y = xy(node)
    return min(
        (x - ax) ** 2 + (y - ay) ** 2
        for ax, ay in anchors
    ) <= radius_m ** 2

m = folium.Map(
    location=[
        (small_anchor[1] + main_anchor[1]) / 2,
        (small_anchor[0] + main_anchor[0]) / 2,
    ],
    zoom_start=15,
    tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attr="Tiles © Esri and its data providers",
    control_scale=True,
)

for component, color, label in [
    (main_component, "#16856b", "Main network"),
    (small_component, "#2864dc", "Disconnected component"),
]:
    layer = folium.FeatureGroup(name=label)
    count = 0

    for u, v in graph.subgraph(component).edges():
        if not (near_anchor(u) or near_anchor(v)):
            continue

        folium.PolyLine(
            [[u[1], u[0]], [v[1], v[0]]],
            color=color,
            weight=3,
            opacity=0.8,
        ).add_to(layer)
        count += 1

    layer.add_to(m)
    print(f"{label}: {count:,} local edges displayed")

folium.Marker(
    [small_anchor[1], small_anchor[0]],
    tooltip="Disconnected component",
    popup=f"Disconnected component: {len(small_component)} nodes",
    icon=folium.Icon(color="blue"),
).add_to(m)

folium.Marker(
    [main_anchor[1], main_anchor[0]],
    tooltip="Main network",
    popup=f"Main component: {len(main_component)} nodes",
    icon=folium.Icon(color="green"),
).add_to(m)

folium.PolyLine(
    [
        [small_anchor[1], small_anchor[0]],
        [main_anchor[1], main_anchor[0]],
    ],
    color="red",
    weight=4,
    dash_array="8, 8",
    tooltip=f"{gap_m:.3f} m straight-line gap; not a verified route",
).add_to(m)

folium.LayerControl().add_to(m)
output.parent.mkdir(parents=True, exist_ok=True)
m.save(str(output))

print("\nMAP CREATED:", output.resolve())
print("File size:", f"{output.stat().st_size / 1e6:.2f} MB")
print("Original network data was not modified.")
