
from pathlib import Path
import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "data/processed/washrooms"


def clean(value):
    if pd.isna(value):
        return None

    text = str(value).strip()
    return text if text and text.lower() not in {
        "none", "nan", "null", "n/a"
    } else None


def load_parks():
    gdf = gpd.read_file(
        FOLDER / "parks_validated.geojson"
    ).to_crs("EPSG:4326")

    records = []

    for _, row in gdf.iterrows():
        geom = row.geometry

        if geom.geom_type != "MultiPoint" or len(geom.geoms) != 1:
            raise ValueError("Unexpected Parks geometry")

        point = geom.geoms[0]
        asset_id = clean(row["ASSET_ID"])

        records.append({
            "site_id": f"parks-site:{asset_id}",
            "site_name": clean(row["AssetName"])
                         or clean(row["LOCATION"]),
            "address": clean(row["ADDRESS"]),
            "source": "parks",
            "source_record_count": 1,
            "source_id": asset_id,
            "accessibility_raw": clean(
                row["ACCESSIBLE_FEATURES"]
            ),
            "hours_raw": clean(row["HOURS"]),
            "status_raw": clean(row["Status"]),
            "status_reason_raw": clean(row["Reason"]),
            "status_comments_raw": clean(row["Comments"]),
            "posted_date_raw": clean(row["PostedDate"]),
            "geometry": point,
        })

    return records


def load_crem():
    gdf = gpd.read_file(
        FOLDER / "crem_sites.geojson"
    ).to_crs("EPSG:4326")

    records = []

    for _, row in gdf.iterrows():
        geom = row.geometry

        if geom is None or geom.is_empty:
            raise ValueError("Missing CREM site geometry")

        if geom.geom_type == "MultiPoint":
            if len(geom.geoms) != 1:
                raise ValueError("CREM site has multiple coordinates")
            geom = geom.geoms[0]

        elif geom.geom_type != "Point":
            raise ValueError(
                f"Unexpected CREM geometry: {geom.geom_type}"
            )

        records.append({
            "site_id": row["site_id"],
            "site_name": clean(row["site_name"]),
            "address": clean(row["address"]),
            "source": "crem",
            "source_record_count": int(
                row["washroom_count"]
            ),
            "source_id": None,
            "accessibility_raw": None,
            "hours_raw": None,
            "status_raw": None,
            "status_reason_raw": None,
            "status_comments_raw": None,
            "posted_date_raw": None,
            "geometry": geom,
        })

    return records


def main():
    records = load_parks() + load_crem()

    sites = gpd.GeoDataFrame(
        records,
        geometry="geometry",
        crs="EPSG:4326",
    )

    if sites["site_id"].duplicated().any():
        raise ValueError("Duplicate site IDs detected")

    if sites.geometry.isna().any():
        raise ValueError("Missing site geometry")

    if not sites.geometry.geom_type.eq("Point").all():
        raise ValueError("All site geometries must be Points")

    output = FOLDER / "washroom_sites_candidates.geojson"
    sites.to_file(output, driver="GeoJSON")

    print("=" * 60)
    print("CIVICACCESS — UNIFIED SITE INVENTORY")
    print("=" * 60)
    print("Total candidate sites:", len(sites))
    print("Parks candidate sites:", int(
        sites["source"].eq("parks").sum()
    ))
    print("CREM candidate sites:", int(
        sites["source"].eq("crem").sum()
    ))
    print(
        "Underlying source records:",
        int(sites["source_record_count"].sum())
    )
    print("Unique site IDs:", sites["site_id"].nunique())

    print("\nSaved:")
    print(output.relative_to(ROOT))
    print("\nCross-source deduplication not yet performed.")


if __name__ == "__main__":
    main()
