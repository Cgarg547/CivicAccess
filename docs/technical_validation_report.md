# CivicAccess — Technical Validation Report

Validation performed: October 20, 2026

## 1. Purpose

This report documents checks performed against CivicAccess's local source data, processed datasets, and published analytical outputs.

A passing check demonstrates consistency with the stated test. It does not establish that Toronto's source datasets are complete, that all washrooms are operational, or that mapped routes are physically accessible.

## 2. Washroom source and candidate-site integrity

- Original records: 355 Toronto Parks and 119 CREM records (474 total).
- Candidate sites: 367 (355 Parks sites and 12 CREM building sites).
- Original source geometries: no missing, empty, or invalid geometries detected.
- CREM grouping: 12 independently identified building/address groups, representing 119 records.
- CREM group-count mismatches: 0.
- Candidate-site identifiers: unique.

Result: PASS.

## 3. Neighbourhood and population validation

- Neighbourhoods: 158.
- Candidate sites independently assigned to neighbourhoods: 367.
- Unmatched or ambiguously assigned sites: 0.
- Neighbourhood site-count mismatches: 0.
- Neighbourhoods without a recorded candidate site: 26.
- Population records independently compared with the source workbook: 158.
- Population and published rate mismatches: 0.

Neighbourhood codes were compared as strings to preserve leading zeros.

Result: PASS.

## 4. Park proximity validation

- Unique Toronto parks analyzed: 1,628.
- Candidate washroom sites: 367.
- Independent calculation: EPSG:26917 projected geometry, minimum straight-line polygon-to-site distance, and polygon coverage for internal candidate counts.
- Distance mismatches: 0.
- Internal candidate-count mismatches: 0.
- Published park geometry validity issues: 0.

Park proximity is a straight-line geometric measurement, not walking distance or confirmed washroom access.

Result: PASS.

## 5. Washroom-to-network snap validation

- Snap records: 367.
- Reproduced snap-distance mismatches above 0.01 m: 0.
- Maximum reproduced distance difference: 0.0005 m.
- Maximum snap-point offset from recorded edge: 0.0001 m.
- Maximum edge-fraction difference: 0.00000419.
- Snap geometry mismatches: 0.
- Unique coordinate-pair edges in the original network: 95,042.
- Recorded snap edges absent from original network: 0.

These checks do not independently prove that every recorded edge is the nearest possible edge or that each connection is safely walkable.

Result: PASS.

## 6. Pedestrian-network connectivity

The original network contains six connected components:

- Main component: 72,307 nodes, 355 washroom sites.
- Toronto Islands component: 275 nodes, 12 washroom sites.
- Four additional components: 12 nodes total, no washroom sites.

All 367 sites were assigned to a component. The independently calculated 12 nodes in components without washrooms matched the saved network-access summary.

Disconnected components were not joined by invented pedestrian connections. Ferry travel is not modeled.

Result: PASS.

## 7. Walking-network coverage reproducibility

The original coverage calculation was executed with its output redirected to a temporary file. The published result was not overwritten.

- Neighbourhoods: 158.
- Graph edges processed: 95,360.
- Total assigned network length: 8,024.01 km.
- Five-minute covered network: 909.48 km.
- Ten-minute covered network: 3,179.99 km.
- Fifteen-minute covered network: 5,315.63 km.
- Exact reproduced-versus-published GeoJSON content match: True.

The published analysis is reproducible using the current inputs and calculation script.

Result: PASS.

## 8. Interpretation and remaining limitations

Walking coverage measures the share of mapped pedestrian-network length reachable within modeled distance thresholds at 80 metres per minute. It is not population coverage, measured travel time, or verified accessibility.

The source network may contain disconnected segments, missing pedestrian connections, and roads without sidewalks. Washroom availability, operating hours, accessible entrances, and real-world walking conditions have not been independently verified.

Reproducibility confirms that the current calculation produces the published output; it does not independently validate every modeling assumption.

## 9. Overall assessment

All checks documented above passed.

CivicAccess's published results have demonstrated data consistency, traceability to the identified source records, and reproducibility of the walking-network coverage calculation, subject to the stated data and methodology limitations.
