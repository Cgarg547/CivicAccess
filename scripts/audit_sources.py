#!/usr/bin/env python3
"""Inventory source files, calculate SHA-256 hashes, and flag duplicates."""

import argparse
import csv
import hashlib
from pathlib import Path


FIELDS = [
    "filename",
    "extension",
    "bytes",
    "sha256",
    "duplicate_of",
    "source_url",
    "retrieved_date",
    "license",
    "dataset_role",
    "review_status",
]


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser(
        description="Create a read-only source-file inventory."
    )
    parser.add_argument(
        "--data",
        type=Path,
        required=True,
        help="Directory containing source files",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/processed/source_manifest.csv"),
    )
    args = parser.parse_args()

    if not args.data.is_dir():
        parser.error(f"Data directory does not exist: {args.data}")

    files = sorted(
        (
            path for path in args.data.iterdir()
            if path.is_file() and path.name != ".DS_Store"
        ),
        key=lambda path: path.name,
    )

    seen_hashes = {}
    rows = []

    for path in files:
        digest = sha256_file(path)
        duplicate_of = seen_hashes.get(digest)

        if duplicate_of is None:
            seen_hashes[digest] = path.name

        rows.append({
            "filename": path.name,
            "extension": path.suffix.lower(),
            "bytes": path.stat().st_size,
            "sha256": digest,
            "duplicate_of": duplicate_of or "",
            "source_url": "",
            "retrieved_date": "",
            "license": "",
            "dataset_role": "unclassified",
            "review_status": "pending",
        })

    args.output.parent.mkdir(parents=True, exist_ok=True)

    with args.output.open(
        "w", newline="", encoding="utf-8"
    ) as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    duplicates = [row for row in rows if row["duplicate_of"]]

    print(f"Indexed {len(rows)} files → {args.output}")
    print(f"Exact duplicate files found: {len(duplicates)}")

    for row in duplicates:
        print(f"  {row['filename']} duplicates {row['duplicate_of']}")

    print("Raw source files were not modified.")


if __name__ == "__main__":
    main()
