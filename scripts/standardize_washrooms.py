
from pathlib import Path
import json
import re

import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "data/processed/washrooms"
OUTPUT = INPUT


def clean_text(value):
    if pd.isna(value):
        return None

    text = str(value).strip()

    if not text or text.lower() in {"none", "null", "nan", "n/a"}:
        return None

    return text


def normalized_text(value):
    value = clean_text(value)

    if value is None:
        return ""

    return re.sub(r"\s+", " ", value.casefold()).strip()


def location_point(geometry):
    if geometry is None or geometry.is_empty:
        raise ValueError("Missing facility geometry")

    if geometry.geom_type == "Point":
        return geometry

    if geometry.geom_type == "MultiPoint":
        if len(geometry.geoms) != 1:
            raise ValueError("MultiPoint has multiple locations")

        return geometry.geoms[0]

    raise ValueError(f"Unsupported geometry: {geometry.geom_type}")


def standardize_parks():
    gdf = gpd.read_file(INPUT / "parks_validated.geojson")

    records = []

    for _, row in gdf.iterrows():
        point = location_point(row.geometry)

        records.append({
            "source": "parks",
            "source_id": clean_text(row["ASSET_ID"]),
            "name": clean_text(row["AssetName"])
                    or clean_text(row["LOCATION"]),
            "address": clean_text(row["ADDRESS"]),
            "facility_type": clean_text(row["TYPE"]),
            "hours_raw": clean_text(row["HOURS"]),
            "status_raw": clean_text(row["Status"]),
            "status_reason_raw": clean_text(row["Reason"]),
            "accessibility_raw": clean_text(
                row["ACCESSIBLE_FEATURES"]
            ),
            "posted_date_raw": clean_text(row["PostedDate"]),
            "longitude": point.x,
            "latitude": point.y,
            "geometry": point,
        })

    return records


def standardize_crem():
    gdf = gpd.read_file(INPUT / "crem_validated.geojson")

    records = []

    for _, row in gdf.iterrows():
        point = location_point(row.geometry)

        records.append({
            "source": "crem",
            "source_id": clean_text(row["FLOC_ID"]),
            "name": clean_text(row["Building Description"]),
            "address": clean_text(row["Address"]),
            "facility_type": clean_text(row["Building Type"]),
            "hours_raw": clean_text(row["Hours Available"]),
            "status_raw": clean_text(row["Washroom Status"]),
            "status_reason_raw": None,
            "accessibility_raw": clean_text(
                row["Accessible Washroom"]
            ),
            "posted_date_raw": None,
            "longitude": point.x,
            "latitude": point.y,
            "geometry": point,
        })

    return records


def main():
    records = standardize_parks() + standardize_crem()

    gdf = gpd.GeoDataFrame(
        records,
        geometry="geometry",
        crs="EPSG:4326",
    )

    # Create a unique row identifier within each source.
    # This is a source-row ID, not a physical-facility ID.
    gdf["source_row_number"] = (
        gdf.groupby("source").cumcount() + 1
    )

    gdf["record_id"] = (
        gdf["source"]
        + ":"
        + gdf["source_row_number"].astype(str).str.zfill(6)
    )

    if gdf["record_id"].duplicated().any():
        raise ValueError("Duplicate generated record IDs detected")

    # Preserve the original source identifier separately.
    gdf["source_id"] = gdf["source_id"].replace(
        {"N/A": None, "n/a": None, "": None}
    )

    gdf["name_normalized"] = gdf["name"].apply(normalized_text)
    gdf["address_normalized"] = gdf["address"].apply(
        normalized_text
    )

    geojson_path = OUTPUT / "washrooms_standardized.geojson"
    csv_path = OUTPUT / "washrooms_standardized.csv"

    gdf.to_file(geojson_path, driver="GeoJSON")
    gdf.drop(columns="geometry").to_csv(csv_path, index=False)

    print("=" * 60)
    print("CIVICACCESS — WASHROOM STANDARDIZATION")
    print("=" * 60)
    print("Total records:", len(gdf))
    print("Sources:", gdf["source"].value_counts().to_dict())
    print("Unique source IDs:", gdf["record_id"].nunique())
    print("Missing names:", int(gdf["name"].isna().sum()))
    print("Missing addresses:", int(gdf["address"].isna().sum()))
    print("Missing hours:", int(gdf["hours_raw"].isna().sum()))
    print(
        "Missing accessibility information:",
        int(gdf["accessibility_raw"].isna().sum()),
    )

    print("\nOperating status values:")
    for source, group in gdf.groupby("source"):
        print(source, group["status_raw"].value_counts().to_dict())

    print("\nFiles created:")
    print(geojson_path.relative_to(ROOT))
    print(csv_path.relative_to(ROOT))

    print("\nNo facilities have been deduplicated.")


if __name__ == "__main__":
    main()
