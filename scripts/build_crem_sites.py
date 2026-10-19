
from pathlib import Path
import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "data/processed/washrooms"

INPUT = FOLDER / "crem_validated.geojson"


def clean(value):
    if pd.isna(value):
        return ""
    return str(value).strip()


def main():
    gdf = gpd.read_file(INPUT).to_crs("EPSG:4326")

    # Keep the original source row order.
    gdf = gdf.reset_index(drop=True)

    gdf["record_id"] = [
        f"crem:{i:06d}"
        for i in range(1, len(gdf) + 1)
    ]

    # Site grouping uses building name, address and coordinate.
    # This avoids grouping unrelated buildings solely by FLOC_ID.
    gdf["site_key"] = gdf.apply(
        lambda row: (
            clean(row["Building Description"]).casefold(),
            clean(row["Address"]).casefold(),
            row.geometry.wkb_hex,
        ),
        axis=1,
    )

    unique_keys = list(dict.fromkeys(gdf["site_key"]))

    site_ids = {
        key: f"crem-site:{i:04d}"
        for i, key in enumerate(unique_keys, start=1)
    }

    gdf["site_id"] = gdf["site_key"].map(site_ids)

    sites = []

    for site_id, group in gdf.groupby("site_id", sort=True):
        first = group.iloc[0]

        accessibility = (
            group["Accessible Washroom"]
            .astype(str)
            .str.strip()
            .str.casefold()
        )

        gender_inclusive = (
            group["Gender Inclusive"]
            .astype(str)
            .str.strip()
            .str.casefold()
        )

        sites.append({
            "site_id": site_id,
            "site_name": clean(first["Building Description"]),
            "address": clean(first["Address"]),
            "source": "crem",
            "washroom_count": len(group),
            "accessible_yes_count": int(
                accessibility.eq("yes").sum()
            ),
            "gender_inclusive_yes_count": int(
                gender_inclusive.eq("yes").sum()
            ),
            "geometry": first.geometry,
        })

    sites_gdf = gpd.GeoDataFrame(
        sites,
        geometry="geometry",
        crs="EPSG:4326",
    )

    washrooms = gdf.drop(columns=["site_key"])

    sites_path = FOLDER / "crem_sites.geojson"
    washrooms_path = FOLDER / "crem_washrooms_linked.geojson"

    sites_gdf.to_file(sites_path, driver="GeoJSON")
    washrooms.to_file(washrooms_path, driver="GeoJSON")

    print("=" * 60)
    print("CIVICACCESS — CREM SITE MODEL")
    print("=" * 60)
    print("Source washroom records:", len(washrooms))
    print("Unique sites:", len(sites_gdf))
    print("Unique washroom record IDs:", washrooms["record_id"].nunique())
    print("Washrooms linked to sites:", washrooms["site_id"].notna().sum())

    print("\nSites:")
    print(
        sites_gdf[
            ["site_id", "site_name", "washroom_count",
             "accessible_yes_count"]
        ].to_string(index=False)
    )

    print("\nSaved:")
    print(sites_path.relative_to(ROOT))
    print(washrooms_path.relative_to(ROOT))


if __name__ == "__main__":
    main()
