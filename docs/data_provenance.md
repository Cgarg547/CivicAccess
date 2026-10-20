# CivicAccess Data Provenance Register

This register records the source information verified for the
datasets used by CivicAccess. Local file hashes are recorded
separately in the generated source manifests.

## 1. Parks washroom facilities

- Local input: `data/raw/washrooms/Washroom Facilities - 4326.geojson`
- Official dataset:
  https://open.toronto.ca/dataset/washroom-facilities/
- Publisher: City of Toronto
- Licence listed on dataset page: Open Government Licence - Toronto
- Local retrieval date: Not recorded
- Local file identity: See source manifest
- Status: Official dataset page identified; exact local download
  version and retrieval date not independently established.

## 2. Pedestrian network

- Local input: `data/raw/pedestrians/Pedestrian Network Data - 4326.geojson`
- Official dataset:
  https://open.toronto.ca/dataset/pedestrian-network/
- Publisher: City of Toronto
- Licence listed on dataset page: Open Government Licence - Toronto
- Local retrieval date: Not recorded
- Local file identity: See source manifest
- Status: Official dataset page identified; exact local download
  version and retrieval date not independently established.
- Duplicate review: A second GeoJSON file has an identical
  SHA-256 hash. See the pedestrian source manifest.

## 3. Neighbourhood profiles

- Local input:
  `data/raw/neighbourhoods/neighbourhood-profiles-2021-158-model.xlsx`
- Official dataset:
  https://open.toronto.ca/dataset/neighbourhood-profiles/
- Publisher: City of Toronto
- Licence listed on dataset page: Open Government Licence - Toronto
- Local retrieval date: Not recorded
- Local file identity: See source manifest
- Status: Official dataset page identified; exact local download
  version and retrieval date not independently established.

## 4. Neighbourhood boundaries

- Local input:
  `data/raw/neighbourhoods/Neighbourhoods - 4326.geojson`
- City reference:
  https://www.toronto.ca/city-government/data-research-maps/neighbourhoods-communities/neighbourhood-profiles/about-toronto-neighbourhoods/
- Geographic model: Toronto's 158-neighbourhood geography.
- Status: City reference identified. The exact official download
  resource and applicable licence for this local file still need
  to be confirmed.

## 5. CREM public washrooms

- Local input:
  `data/raw/CREM Public Washrooms - 4326.geojson`
- Official source URL: Not yet verified.
- Publisher and licence: Require confirmation for this exact resource.
- Local retrieval date: Not recorded.
- Status: Pending source identification.

## Reproducibility notes

SHA-256 hashes identify file contents; they do not independently
prove publisher identity, licence, download date, or data accuracy.

The generated source manifests provide local file fingerprints.
Original raw files are retained unchanged.

Do not interpret an unverified field as confirmed provenance.
