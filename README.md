# CivicAccess

**Exploring public washroom accessibility and neighbourhood coverage in Toronto.**

CivicAccess is an interactive, open-data-driven web application that helps people explore recorded public washroom facilities across Toronto, understand differences in neighbourhood coverage, and evaluate hypothetical infrastructure scenarios.

Built with **Next.js, TypeScript, MapLibre GL JS, Python, and Toronto Open Data**, the project combines geospatial data processing with an interactive mapping dashboard.

**[Explore the source code](https://github.com/Cgarg547/CivicAccess)**

> **Project status:** Interactive prototype. Facility information is derived from published datasets and has not been independently verified in the field.

## The Problem

Access to public washrooms is an important part of creating inclusive, accessible cities.

However, information about public washroom locations, accessibility features, and neighbourhood coverage is often distributed across multiple datasets.

This makes it difficult to answer questions such as:

- Where are public washroom facilities recorded across Toronto?
- Which locations have published evidence of accessibility features?
- Which neighbourhoods have fewer recorded facilities relative to their populations?
- How might hypothetical additional facilities change neighbourhood-level coverage?

CivicAccess brings these questions together in one interactive application.

## Features

### 1. Interactive Public Washroom Map

Explore recorded public washroom sites across Toronto.

- Interactive map with selectable facility markers
- Search facilities by name or location information
- Filter by source dataset
- Filter by reported accessibility evidence
- Inspect facility information and available source attributes
- View detailed records for facilities in the CREM dataset

### 2. Neighbourhood Coverage Explorer

Compare recorded washroom coverage across Toronto's 158 neighbourhoods.

- Interactive neighbourhood choropleth
- Recorded candidate-site counts
- Population-normalized coverage rates
- Accessibility-reporting indicators
- Searchable neighbourhood rankings
- Side-by-side neighbourhood comparisons

The application reports sites per 10,000 residents to help compare neighbourhoods with different population sizes.

### 3. Hypothetical Scenario Planner

Explore how adding hypothetical candidate sites would change a selected neighbourhood's coverage metrics.

- Select a neighbourhood
- Adjust the number of hypothetical additional sites
- Compare existing and simulated site counts
- View changes in sites per 10,000 residents
- Visualize the selected neighbourhood's simulated metric
- Copy a scenario summary

**Important:** Scenarios are mathematical illustrations, not recommendations for specific construction locations. They do not establish site feasibility, walking accessibility, operating costs, or actual service improvements.

### 4. Data Methodology and Transparency

CivicAccess distinguishes between:

- Recorded candidate sites and independently verified operating facilities
- Reported accessibility evidence and accessibility that has not been established
- Individual washroom records and physical facility sites
- Existing data and hypothetical scenarios

These distinctions are essential for responsible interpretation of the results.

## Project at a Glance

| Metric | Value |
|---|---:|
| Recorded candidate sites | 366 |
| Underlying washroom records | 473 |
| Toronto neighbourhoods analyzed | 158 |
| Neighbourhoods with zero recorded candidate sites in the included datasets | 26 |
| CREM individual washroom records | 119 |

These figures describe the datasets included in the current project, not a complete or field-verified inventory of every public washroom in Toronto.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Mapping | MapLibre GL JS, React Map GL |
| Data processing | Python |
| Geospatial formats | GeoJSON, CSV |
| Version control | Git, GitHub |

## Project Structure

```text
civicaccess-starter/
├── README.md
├── scripts/
│   ├── validate_washrooms.py
│   ├── standardize_washrooms.py
│   ├── build_crem_sites.py
│   ├── build_unified_sites.py
│   ├── find_site_duplicates.py
│   ├── build_accessibility_summary.py
│   ├── build_neighbourhood_coverage.py
│   └── build_population_coverage.py
├── data/
│   ├── raw/                 # Local source files; excluded from Git
│   ├── derived/             # Local intermediate files
│   └── processed/           # Processed analytical outputs
└── frontend/
    ├── public/
    │   ├── data/
    │   └── maplibre-worker.mjs
    └── src/
        ├── app/
        │   ├── page.tsx
        │   └── about/
        ├── components/
        │   ├── CivicAccessMap.tsx
        │   ├── DashboardOverview.tsx
        │   ├── WashroomSidebar.tsx
        │   ├── NeighbourhoodInsights.tsx
        │   ├── ScenarioPlanner.tsx
        │   └── FacilityDetailsPanel.tsx
        └── lib/
            ├── scenarioPlanner.ts
            └── scenarioPlanner.test.ts
```

## Getting Started

### Prerequisites

- Node.js and npm compatible with Next.js 16
- Git
- Python 3 for the optional data-processing workflow

### 1. Clone the repository

```bash
git clone https://github.com/Cgarg547/CivicAccess.git
cd CivicAccess
```

### 2. Install frontend dependencies

```bash
cd frontend
npm ci
```

### 3. Start the development server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

The frontend includes processed GeoJSON and JSON files in `frontend/public/data/`, so the existing interactive views do not require downloading the original raw datasets.

### 4. Run the scenario planner tests

From the `frontend` directory:

```bash
npx tsx src/lib/scenarioPlanner.test.ts
npx tsc --noEmit
```

## Data Sources

The project uses published City of Toronto datasets, including:

| Dataset | Purpose |
|---|---|
| Parks Washroom Facilities | Recorded parks washroom sites and published attributes |
| CREM Public Washrooms | Individual washroom records and building-level grouping |
| Toronto Neighbourhoods | Geographic boundaries for neighbourhood analysis |
| 2021 Neighbourhood Profiles | Census-based population estimates |

CivicAccess also uses Toronto pedestrian-network data for preliminary 5-, 10-, and 15-minute walking-network coverage analysis. The resulting percentages measure mapped network length near recorded candidate sites, not population coverage or verified accessible routes.

**Data provenance:** Source-file metadata and processing outputs are available in `data/processed/`. Raw source downloads are not included in the GitHub repository.

Official data portal: https://open.toronto.ca/

## Data Processing Methodology

CivicAccess uses a reproducible analytical workflow:

1. **Validate source data** — inspect records, coordinates, and important attributes.
2. **Standardize washroom records** — normalize information from different source schemas.
3. **Group CREM records into sites** — distinguish individual washrooms from their building locations.
4. **Create a unified candidate-site dataset** — combine Parks and CREM site information while retaining source provenance.
5. **Review potential duplicates** — identify nearby cross-source candidates without automatically assuming they represent the same facility.
6. **Summarize accessibility evidence** — preserve published indicators and distinguish missing information from confirmed attributes.
7. **Calculate neighbourhood coverage** — spatially assign candidate sites to neighbourhood boundaries.
8. **Join population estimates** — calculate sites per 10,000 residents.
9. **Prepare frontend datasets** — export compact files for interactive mapping.

### Coverage Calculation

For a neighbourhood with a positive population estimate:

\[
\text{Sites per 10,000 residents}
=
\frac{\text{Recorded candidate sites}}{\text{Population estimate}}
\times 10,000
\]

### Walking Accessibility Methodology

CivicAccess includes preliminary walking-network coverage estimates for Toronto's 158 neighbourhoods.

The analysis uses recorded candidate washroom sites, mapped pedestrian-network data, and an assumed walking speed of **80 metres per minute**.

| Walking threshold | Covered network length | Citywide coverage |
|---|---:|---:|
| 5 minutes | 906.58 km | 11.30% |
| 10 minutes | 3,168.15 km | 39.48% |
| 15 minutes | 5,290.33 km | 65.93% |

The total mapped network length is approximately **8,024.01 km**.

For each neighbourhood:

**Network-length coverage (%) = (Mapped network length within the walking threshold / Total mapped neighbourhood network length) × 100**

Citywide percentages are calculated from total network lengths, not by averaging neighbourhood percentages.

**Important limitations:**

- These percentages represent mapped network length, not the percentage of residents with access.
- The analysis uses preliminary network distances, not verified pedestrian travel times.
- Sidewalk continuity, crossings, barriers, and wheelchair accessibility have not been independently validated.
- Candidate washroom operating status and availability have not been independently verified.
- Results are intended for exploratory infrastructure planning, not navigation or guaranteed facility access.

### Scenario Calculation

For a selected neighbourhood:

\[
\text{Simulated site count}
=
\text{Existing site count}
+
\text{Hypothetical additional sites}
\]

The simulated coverage rate uses the same population estimate as the existing coverage rate.

These calculations describe neighbourhood-level site counts. They are not measurements of walking distance, travel time, capacity, or actual accessibility.

## Limitations and Responsible Interpretation

CivicAccess is a decision-support and exploration prototype, not an authoritative directory of currently available washrooms.

- **Operating status:** A recorded site is not necessarily open or available at the time of use.
- **Accessibility:** Missing accessibility information does not mean a facility is inaccessible. Published attributes have not been independently audited.
- **Individual records:** Accessibility information for one washroom within a building should not be assumed to describe every washroom in that building.
- **Coverage:** A neighbourhood with zero recorded candidate sites is not necessarily a neighbourhood with no public washrooms.
- **Population:** Rates use 2021 census-based estimates and may not reflect current population levels or visitor demand.
- **Geographic access:** Site-count coverage does not measure walking accessibility. The separate preliminary walking-network model estimates network-length coverage, but does not verify sidewalks, crossings, barrier-free routes, operating hours, or actual facility availability.
- **Scenario planning:** Hypothetical additions do not identify suitable parcels, establish feasibility, or predict actual usage.

Users should verify facility details with official sources before relying on them for a trip.

## Future Development

Potential improvements include:

- Improved validation of pedestrian connections, crossings, and barriers
- More detailed walkable service-area visualization
- Evidence-based infrastructure priority indicators
- Candidate-location feasibility screening
- Additional accessibility and data-confidence indicators
- More detailed scenario comparisons

These features are planned directions, not implemented functionality.

## Why CivicAccess?

CivicAccess demonstrates how public data can be transformed into a practical tool for exploring urban infrastructure, accessibility information, and geographic differences in service coverage.

The goal is to make complex municipal datasets easier to understand while keeping their limitations visible.

## Author

Developed by [Cgarg547](https://github.com/Cgarg547).

## Acknowledgements

This project uses publicly available datasets published through the **City of Toronto Open Data** portal.

CivicAccess is an independent project and is not an official City of Toronto service.