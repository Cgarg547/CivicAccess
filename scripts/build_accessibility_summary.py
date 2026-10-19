
from pathlib import Path
import json

import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "data/processed/washrooms"

SITES_FILE = FOLDER / "washroom_sites_candidates.geojson"
CREM_FILE = FOLDER / "crem_washrooms_linked.geojson"

OUTPUT_GEOJSON = FOLDER / "washroom_sites_enriched.geojson"
OUTPUT_CSV = FOLDER / "washroom_accessibility_summary.csv"


def clean(value):
    if value is None:
        return None

    if isinstance(value, str):
        value = value.strip()
        if value.lower() in {"", "none", "nan", "null", "n/a"}:
            return None
        return value

    if pd.isna(value):
        return None

    return str(value).strip()


def unique_values(values):
    cleaned = [clean(value) for value in values]
    return sorted({value for value in cleaned if value})


def main():
    sites = gpd.read_file(SITES_FILE)
    crem = gpd.read_file(CREM_FILE)

    if sites["site_id"].duplicated().any():
        raise ValueError("Duplicate site IDs")

    if crem["site_id"].isna().any():
        raise ValueError("Unlinked CREM records")

    crem_groups = {
        site_id: group
        for site_id, group in crem.groupby("site_id")
    }

    records = []

    for _, site in sites.iterrows():
        site_id = site["site_id"]
        source = site["source"]

        result = {
            "site_id": site_id,
            "site_name": clean(site["site_name"]),
            "address": clean(site["address"]),
            "source": source,
            "source_record_count": int(site["source_record_count"]),
            "accessibility_summary": None,
            "accessible_yes_count": None,
            "accessible_no_count": None,
            "gender_inclusive_yes_count": None,
            "public_access_count": None,
            "restricted_access_count": None,
            "accessibility_features": None,
            "hours_summary": None,
            "status_summary": None,
            "geometry": site.geometry,
        }

        if source == "parks":
            features = clean(site["accessibility_raw"])
            hours = clean(site["hours_raw"])
            status = clean(site["status_raw"])

            result["accessibility_features"] = features
            result["hours_summary"] = hours
            result["status_summary"] = (
                f"Raw Parks status: {status}"
                if status is not None
                else "Status not reported"
            )

            result["accessibility_summary"] = (
                "Accessibility features reported"
                if features
                else "Accessibility information not reported"
            )

        elif source == "crem":
            if site_id not in crem_groups:
                raise ValueError(
                    f"Missing CREM records for {site_id}"
                )

            group = crem_groups[site_id]

            if len(group) != result["source_record_count"]:
                raise ValueError(
                    f"Record count mismatch for {site_id}"
                )

            accessible_yes = int(
                group["Accessible Washroom"]
                .astype(str)
                .str.strip()
                .str.lower()
                .eq("yes")
                .sum()
            )

            accessible_no = int(
                group["Accessible Washroom"]
                .astype(str)
                .str.strip()
                .str.lower()
                .eq("no")
                .sum()
            )

            gender_yes = int(
                group["Gender Inclusive"]
                .astype(str)
                .str.strip()
                .str.lower()
                .eq("yes")
                .sum()
            )

            statuses = (
                group["Washroom Status"]
                .fillna("")
                .astype(str)
                .str.strip()
            )

            public_count = int(
                statuses.eq("Open - Public Access").sum()
            )

            restricted_count = int(
                statuses.eq(
                    "Open - Public Access to VIA Passengers only"
                ).sum()
            )

            hours = unique_values(group["Hours Available"])
            status_values = unique_values(group["Washroom Status"])

            result["accessible_yes_count"] = accessible_yes
            result["accessible_no_count"] = accessible_no
            result["gender_inclusive_yes_count"] = gender_yes
            result["public_access_count"] = public_count
            result["restricted_access_count"] = restricted_count

            result["accessibility_summary"] = (
                f"{accessible_yes} of {len(group)} washroom records "
                "marked accessible"
            )

            result["hours_summary"] = (
                " | ".join(hours) if hours else None
            )

            result["status_summary"] = (
                " | ".join(status_values)
                if status_values
                else "Status not reported"
            )

        else:
            raise ValueError(f"Unexpected source: {source}")

        records.append(result)

    enriched = gpd.GeoDataFrame(
        records,
        geometry="geometry",
        crs=sites.crs,
    )

    if len(enriched) != len(sites):
        raise ValueError("Site count changed")

    if int(enriched["source_record_count"].sum()) != 473:
        raise ValueError("Underlying record count changed")

    enriched.to_file(
        OUTPUT_GEOJSON,
        driver="GeoJSON",
    )

    enriched.drop(columns="geometry").to_csv(
        OUTPUT_CSV,
        index=False,
    )

    print("=" * 65)
    print("CIVICACCESS — ACCESSIBILITY SUMMARY")
    print("=" * 65)

    print("Total sites:", len(enriched))
    print(
        "Parks sites:",
        int(enriched["source"].eq("parks").sum()),
    )
    print(
        "CREM sites:",
        int(enriched["source"].eq("crem").sum()),
    )
    print(
        "Underlying washroom records:",
        int(enriched["source_record_count"].sum()),
    )

    crem_summary = enriched[
        enriched["source"] == "crem"
    ]

    print(
        "CREM records marked accessible:",
        int(crem_summary["accessible_yes_count"].sum()),
    )
    print(
        "CREM gender-inclusive records:",
        int(crem_summary["gender_inclusive_yes_count"].sum()),
    )
    print(
        "CREM restricted-access records:",
        int(crem_summary["restricted_access_count"].sum()),
    )

    print("\nSaved:")
    print(OUTPUT_GEOJSON.relative_to(ROOT))
    print(OUTPUT_CSV.relative_to(ROOT))


if __name__ == "__main__":
    main()
