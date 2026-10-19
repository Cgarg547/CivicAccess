
from pathlib import Path
import json
import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]

SOURCES = {
    "parks": ROOT / "data/raw/washrooms/Washroom Facilities - 4326.geojson",
    "crem": ROOT / "data/raw/CREM Public Washrooms - 4326.geojson",
}

OUTPUT = ROOT / "data/processed/washrooms"
OUTPUT.mkdir(parents=True, exist_ok=True)


def validate_source(name, path):
    print(f"\n{'=' * 60}")
    print(f"VALIDATING: {name.upper()}")
    print("=" * 60)

    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    gdf = gpd.read_file(path)

    print(f"Records: {len(gdf):,}")
    print(f"CRS: {gdf.crs}")
    print(f"Geometry types: {gdf.geometry.geom_type.value_counts().to_dict()}")

    missing_geometry = int(gdf.geometry.isna().sum())
    empty_geometry = int(gdf.geometry.is_empty.sum())

    print(f"Missing geometries: {missing_geometry}")
    print(f"Empty geometries: {empty_geometry}")

    print("\nAttributes:")
    for column in gdf.columns:
        if column != "geometry":
            missing = int(gdf[column].isna().sum())
            print(f"  {column}: {missing} null values")

    if gdf.crs is None:
        raise ValueError(f"{name}: Missing coordinate reference system")

    # Normalize geometry coordinates to longitude/latitude.
    wgs84 = gdf.to_crs("EPSG:4326")

    def inspect_coordinates(geom):
        if geom is None or geom.is_empty:
            return {
                "valid_coordinate": False,
                "point_count": 0,
            }

        if geom.geom_type == "Point":
            points = [geom]
        elif geom.geom_type == "MultiPoint":
            points = list(geom.geoms)
        else:
            return {
                "valid_coordinate": False,
                "point_count": 0,
            }

        valid = all(
            -180 <= point.x <= 180
            and -90 <= point.y <= 90
            for point in points
        )

        return {
            "valid_coordinate": valid,
            "point_count": len(points),
        }

    inspections = wgs84.geometry.apply(inspect_coordinates)

    wgs84["valid_coordinate"] = inspections.apply(
        lambda item: item["valid_coordinate"]
    )

    wgs84["geometry_point_count"] = inspections.apply(
        lambda item: item["point_count"]
    )

    print(
        "\nInvalid coordinate records:",
        int((~wgs84["valid_coordinate"]).sum())
    )

    print(
        "Multi-location records:",
        int((wgs84["geometry_point_count"] > 1).sum())
    )

    report = {
        "source": name,
        "path": str(path.relative_to(ROOT)),
        "records": len(wgs84),
        "crs": str(gdf.crs),
        "geometry_types": {
            str(k): int(v)
            for k, v in gdf.geometry.geom_type.value_counts().items()
        },
        "missing_geometries": missing_geometry,
        "empty_geometries": empty_geometry,
        "invalid_coordinate_records": int(
            (~wgs84["valid_coordinate"]).sum()
        ),
        "multi_location_records": int(
            (wgs84["geometry_point_count"] > 1).sum()
        ),
        "columns": [
            str(column)
            for column in gdf.columns
            if column != "geometry"
        ],
    }

    output_file = OUTPUT / f"{name}_validated.geojson"
    wgs84.to_file(output_file, driver="GeoJSON")

    print(f"\nSaved: {output_file.relative_to(ROOT)}")

    return report


def main():
    reports = []

    for name, path in SOURCES.items():
        reports.append(validate_source(name, path))

    report_file = OUTPUT / "validation_report.json"

    with report_file.open("w", encoding="utf-8") as f:
        json.dump(reports, f, indent=2)

    total = sum(report["records"] for report in reports)

    print("\n" + "=" * 60)
    print("CIVICACCESS — WASHROOM VALIDATION SUMMARY")
    print("=" * 60)

    for report in reports:
        print(f"{report['source']}: {report['records']:,} records")

    print(f"Total source records: {total:,}")
    print(f"Report: {report_file.relative_to(ROOT)}")
    print("\nValidation completed. No deduplication performed.")


if __name__ == "__main__":
    main()
