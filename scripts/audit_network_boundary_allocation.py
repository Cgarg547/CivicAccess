
import json
from pathlib import Path

from pyproj import Geod, Transformer
from shapely.geometry import LineString, shape
from shapely.ops import transform
from shapely.strtree import STRtree

NETWORK_PATH = Path(
    "data/raw/pedestrians/Pedestrian Network Data - 4326.geojson"
)

NEIGHBOURHOOD_PATH = Path(
    "data/processed/neighbourhoods/neighbourhood_population_coverage.geojson"
)

GEOD = Geod(ellps="WGS84")

TO_METERS = Transformer.from_crs(
    "EPSG:4326",
    "EPSG:26917",
    always_xy=True,
)


def main():
    print("=" * 65)
    print("CIVICACCESS — NETWORK BOUNDARY ALLOCATION AUDIT")
    print("=" * 65)

    with NETWORK_PATH.open(encoding="utf-8") as f:
        network = json.load(f)["features"]

    with NEIGHBOURHOOD_PATH.open(encoding="utf-8") as f:
        neighbourhoods = json.load(f)["features"]

    polygons = [
        transform(TO_METERS.transform, shape(f["geometry"]))
        for f in neighbourhoods
    ]

    tree = STRtree(polygons)

    unique_edges = set()

    source_geodesic_m = 0.0
    source_projected_m = 0.0
    allocated_m = 0.0
    outside_m = 0.0
    overlap_m = 0.0

    edges_with_outside_length = 0
    edges_with_overlap = 0

    print("\nAuditing unique coordinate-pair edges...")

    for feature in network:
        geometry = feature.get("geometry") or {}

        for coordinates in geometry.get("coordinates") or []:
            for a, b in zip(coordinates, coordinates[1:]):
                start = tuple(a[:2])
                end = tuple(b[:2])

                if start == end:
                    continue

                key = tuple(sorted((start, end)))

                if key in unique_edges:
                    continue

                unique_edges.add(key)

                geodesic_m = GEOD.inv(
                    start[0], start[1],
                    end[0], end[1],
                )[2]

                ax, ay = TO_METERS.transform(*start)
                bx, by = TO_METERS.transform(*end)

                line = LineString([(ax, ay), (bx, by)])
                projected_m = line.length

                source_geodesic_m += geodesic_m
                source_projected_m += projected_m

                candidate_indices = tree.query(line)

                intersections = []

                for raw_index in candidate_indices:
                    polygon = polygons[int(raw_index)]
                    clipped = line.intersection(polygon)

                    if not clipped.is_empty:
                        intersections.append(clipped)

                if intersections:
                    from shapely.ops import unary_union

                    union = unary_union(intersections)

                    unique_inside_m = union.length
                    summed_inside_m = sum(
                        part.length for part in intersections
                    )
                else:
                    unique_inside_m = 0.0
                    summed_inside_m = 0.0

                allocated_m += summed_inside_m

                missing_m = max(
                    0.0,
                    projected_m - unique_inside_m,
                )

                duplicated_m = max(
                    0.0,
                    summed_inside_m - unique_inside_m,
                )

                outside_m += missing_m
                overlap_m += duplicated_m

                if missing_m > 0.01:
                    edges_with_outside_length += 1

                if duplicated_m > 0.01:
                    edges_with_overlap += 1

    print("\nRESULTS")
    print("-" * 65)

    print("Unique edges:", len(unique_edges))

    print(
        "Geodesic source length:",
        round(source_geodesic_m / 1000, 3),
        "km",
    )

    print(
        "Projected source length:",
        round(source_projected_m / 1000, 3),
        "km",
    )

    print(
        "Allocated neighbourhood length:",
        round(allocated_m / 1000, 3),
        "km",
    )

    print(
        "Outside neighbourhood polygons:",
        round(outside_m / 1000, 3),
        "km",
    )

    print(
        "Overlapping allocation:",
        round(overlap_m / 1000, 3),
        "km",
    )

    print(
        "Edges with outside portions:",
        edges_with_outside_length,
    )

    print(
        "Edges with overlapping portions:",
        edges_with_overlap,
    )

    print("\nRECONCILIATION")
    print("-" * 65)

    expected_allocated = (
        source_projected_m - outside_m + overlap_m
    )

    difference = allocated_m - expected_allocated

    print(
        "Allocation reconciliation difference:",
        round(difference, 6),
        "m",
    )

    print(
        "\nNote: this audits spatial allocation, "
        "not whether every network segment is "
        "suitable for pedestrian travel."
    )


if __name__ == "__main__":
    main()

