# CivicAccess — Step 1: source-data inventory

This starter does **not** claim to implement routing, accessibility, or the website. It provides a reproducible read-only inventory of files before data transformation.

## Requirements
- Python 3.10 or later. No third-party Python packages required for Step 1.

## Run on macOS
```bash
cd civicaccess-starter
python3 scripts/audit_sources.py --data '/absolute/path/to/your/Toronto-files'
```

Output: `data/processed/source_manifest.csv` containing names, byte sizes and SHA-256 hashes. Source URLs, dates and license are deliberately blank until verified. Never commit sensitive or large raw source files without checking their licenses.

## Step 1 acceptance criteria
- Every supplied file is listed once.
- File hashes are reproducible.
- Canonical datasets are identified separately from format duplicates.
- Dataset metadata, record counts, CRS and QA notes are documented in the next audit step.

## Next work
1. Profile the two washroom GeoJSON sources and preserve source identifiers.
2. Build deduplication review candidates, not automatic merges.
3. Audit the pedestrian network and sidewalk-code compatibility.
4. Acquire 2021 census dissemination-area boundaries and population counts.
5. Implement database/API/frontend only after method decisions are documented.
