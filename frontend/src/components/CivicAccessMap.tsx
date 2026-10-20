
"use client";

import { useEffect, useRef, useState } from "react";

import Map, {
  Source,
  Layer,
  NavigationControl,
  type MapRef,
} from "react-map-gl/maplibre";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import WashroomSidebar, {
  type AccessibilityFilter,
} from "./WashroomSidebar";

import type { CremWashroom } from "./WashroomDetails";
import FacilityDetailsPanel from "./FacilityDetailsPanel";
import ScenarioPlanner from "./ScenarioPlanner";
import { calculateScenario } from "../lib/scenarioPlanner";
import DashboardOverview from "./DashboardOverview";

import NeighbourhoodInsights, {
  type NeighbourhoodFeature,
} from "./NeighbourhoodInsights";

maplibregl.setWorkerUrl("/maplibre-worker.mjs");

type MapMode = "washrooms" | "neighbourhoods" | "walking" | "scenario" | "parks";

type Site = {
  type: "Feature";
  properties: {
    site_id: string;
    site_name: string | null;
    address: string | null;
    source: "parks" | "crem";
    source_record_count: number;
    accessibility_summary: string | null;
    accessibility_features: string | null;
    accessible_yes_count: number | null;
    accessible_no_count: number | null;
    gender_inclusive_yes_count: number | null;
    public_access_count: number | null;
    restricted_access_count: number | null;
    hours_summary: string | null;
    status_summary: string | null;
    status_reason_raw?: string | null;
    status_comments_raw?: string | null;
    posted_date_raw?: string | null;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

type SiteCollection = {
  type: "FeatureCollection";
  features: Site[];
};

type ParkFeature = {
  type: "Feature";
  properties: {
    AREA_ID: number;
    AREA_NAME: string;
    park_area_ha: number;
    nearest_site_distance_m: number;
    internal_candidate_count: number;
  };
  geometry:
    | {
        type: "Polygon";
        coordinates: number[][][];
      }
    | {
        type: "MultiPolygon";
        coordinates: number[][][][];
      };
};

type ParkCollection = {
  type: "FeatureCollection";
  features: ParkFeature[];
};

type NeighbourhoodCollection = {
  type: "FeatureCollection";
  features: NeighbourhoodFeature[];
};

const EMPTY_NEIGHBOURHOODS: NeighbourhoodCollection = {
  type: "FeatureCollection",
  features: [],
};

function fitNeighbourhood(
  map: MapRef | null,
  neighbourhood: NeighbourhoodFeature
) {
  if (!map) return;

  const bounds = new maplibregl.LngLatBounds();
  const geometry = neighbourhood.geometry;

  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) {
      for (const coordinate of ring) {
        bounds.extend([coordinate[0], coordinate[1]]);
      }
    }
  } else if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        for (const coordinate of ring) {
          bounds.extend([coordinate[0], coordinate[1]]);
        }
      }
    }
  }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 75,
      duration: 800,
      maxZoom: 13,
    });
  }
}


function fitPark(map: MapRef | null, park: ParkFeature) {
  if (!map) return;

  const bounds = new maplibregl.LngLatBounds();
  const geometry = park.geometry;

  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) {
      for (const coordinate of ring) {
        bounds.extend([coordinate[0], coordinate[1]]);
      }
    }
  } else if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        for (const coordinate of ring) {
          bounds.extend([coordinate[0], coordinate[1]]);
        }
      }
    }
  }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 100,
      duration: 900,
      maxZoom: 16,
    });
  }
}

export default function CivicAccessMap() {
  const mapRef = useRef<MapRef>(null);

  const [mapMode, setMapMode] =
    useState<MapMode>("washrooms");

  const [parks, setParks] = useState<ParkCollection>({
    type: "FeatureCollection",
    features: [],
  });

  const [parksLoading, setParksLoading] = useState(false);
  const [parksError, setParksError] = useState<string | null>(null);
  const [parksRequested, setParksRequested] = useState(false);

  const [sites, setSites] = useState<Site[]>([]);

  const [cremWashrooms, setCremWashrooms] =
    useState<CremWashroom[]>([]);

  const [neighbourhoods, setNeighbourhoods] =
    useState<NeighbourhoodCollection>(
      EMPTY_NEIGHBOURHOODS
    );

  const [networkNeighbourhoods, setNetworkNeighbourhoods] =
  useState<NeighbourhoodCollection>(
    EMPTY_NEIGHBOURHOODS
  );

  const [walkingMinutes, setWalkingMinutes] =
    useState<5 | 10 | 15>(10);

  const [walkingSearch, setWalkingSearch] = useState("");

  const [walkingSort, setWalkingSort] = useState<
   "lowest" | "highest"
  >("lowest");

  const [search, setSearch] = useState("");

  const [accessibilityFilter, setAccessibilityFilter] =
    useState<AccessibilityFilter>("all");

  const [sourceFilter, setSourceFilter] = useState<
    "all" | "parks" | "crem"
  >("all");

  const [selectedSite, setSelectedSite] =
    useState<Site | null>(null);

  const [selectedNeighbourhood, setSelectedNeighbourhood] =
    useState<NeighbourhoodFeature | null>(null);

  const [selectedPark, setSelectedPark] =
    useState<ParkFeature | null>(null);



  const [hypotheticalSites, setHypotheticalSites] = useState(1);

  const [sitesLoading, setSitesLoading] = useState(true);
  const [cremLoading, setCremLoading] = useState(true);
  const [neighbourhoodsLoading, setNeighbourhoodsLoading] =
    useState(true);
  
  const [networkLoading, setNetworkLoading] =
    useState(true);

  const [error, setError] = useState<string | null>(null);
  const [cremError, setCremError] =
    useState<string | null>(null);
  const [neighbourhoodError, setNeighbourhoodError] =
    useState<string | null>(null);
  
  const [networkError, setNetworkError] =
    useState<string | null>(null);

  useEffect(() => {
    if (mapMode !== "parks" || parksRequested) return;

    setParksRequested(true);
    setParksLoading(true);
    setParksError(null);

    async function loadParks() {
      try {
        const response = await fetch(
          "/data/park_washroom_proximity.geojson"
        );

        if (!response.ok) {
          throw new Error("Unable to load park proximity data");
        }

        const data: ParkCollection = await response.json();

        if (
          data.type !== "FeatureCollection" ||
          !Array.isArray(data.features) ||
          data.features.length !== 1628
        ) {
          throw new Error("Invalid park proximity GeoJSON");
        }

        setParks(data);
      } catch (err) {
        setParksError(
          err instanceof Error
            ? err.message
            : "Unknown park data error"
        );
      } finally {
        setParksLoading(false);
      }
    }

    loadParks();
  }, [mapMode, parksRequested]);

  useEffect(() => {
    async function loadSites() {
      try {
        const response = await fetch(
          "/data/washroom_sites_enriched.geojson"
        );

        if (!response.ok) {
          throw new Error("Unable to load washroom sites");
        }

        const data: SiteCollection = await response.json();

        if (
          data.type !== "FeatureCollection" ||
          !Array.isArray(data.features)
        ) {
          throw new Error("Invalid washroom GeoJSON");
        }

        setSites(data.features);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unknown washroom data error"
        );
      } finally {
        setSitesLoading(false);
      }
    }

    loadSites();
  }, []);

  useEffect(() => {
    async function loadCremWashrooms() {
      try {
        const response = await fetch(
          "/data/crem_washroom_details.json"
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load CREM washroom details"
          );
        }

        const data: CremWashroom[] =
          await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid CREM data");
        }

        setCremWashrooms(data);
      } catch (err) {
        setCremError(
          err instanceof Error
            ? err.message
            : "Unknown CREM data error"
        );
      } finally {
        setCremLoading(false);
      }
    }

    loadCremWashrooms();
  }, []);

  useEffect(() => {
    async function loadNeighbourhoods() {
      try {
        const response = await fetch(
          "/data/neighbourhood_population_coverage.geojson"
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load neighbourhood coverage"
          );
        }

        const data: NeighbourhoodCollection =
          await response.json();

        if (
          data.type !== "FeatureCollection" ||
          !Array.isArray(data.features)
        ) {
          throw new Error("Invalid neighbourhood GeoJSON");
        }

        setNeighbourhoods(data);
      } catch (err) {
        setNeighbourhoodError(
          err instanceof Error
            ? err.message
            : "Unknown neighbourhood data error"
        );
      } finally {
        setNeighbourhoodsLoading(false);
      }
    }

    loadNeighbourhoods();
  }, []);

  useEffect(() => {
  async function loadNetworkNeighbourhoods() {
    try {
      const response = await fetch(
        "/data/neighbourhood_network_length_coverage.geojson"
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load walking-accessibility data"
        );
      }

      const data: NeighbourhoodCollection =
        await response.json();

      if (
        data.type !== "FeatureCollection" ||
        !Array.isArray(data.features) ||
        data.features.length !== 158
      ) {
        throw new Error(
          "Invalid walking-accessibility GeoJSON"
        );
      }

      const requiredFields = [
        "network_length_km",
        "network_length_coverage_5min_pct",
        "network_length_coverage_10min_pct",
        "network_length_coverage_15min_pct",
      ] as const;

      const valid = data.features.every((feature) =>
        requiredFields.every(
          (field) =>
            typeof feature.properties[field] === "number"
        )
      );

      if (!valid) {
        throw new Error(
          "Walking-accessibility measurements are missing"
        );
      }

      setNetworkNeighbourhoods(data);
    } catch (err) {
      setNetworkError(
        err instanceof Error
          ? err.message
          : "Unknown walking-accessibility data error"
      );
    } finally {
      setNetworkLoading(false);
    }
  }

  loadNetworkNeighbourhoods();
}, []);

const walkingCoverageKey =
  `network_length_coverage_${walkingMinutes}min_pct` as
    | "network_length_coverage_5min_pct"
    | "network_length_coverage_10min_pct"
    | "network_length_coverage_15min_pct";

const totalNetworkKm = networkNeighbourhoods.features.reduce(
  (sum, feature) =>
    sum + Number(feature.properties.network_length_km || 0),
  0
);

const coveredNetworkKey =
  `network_length_within_${walkingMinutes}min_km` as
    | "network_length_within_5min_km"
    | "network_length_within_10min_km"
    | "network_length_within_15min_km";

const coveredNetworkKm = networkNeighbourhoods.features.reduce(
  (sum, feature) =>
    sum + Number(feature.properties[coveredNetworkKey] || 0),
  0
);

const citywideCoveragePct =
  totalNetworkKm > 0
    ? (coveredNetworkKm / totalNetworkKm) * 100
    : null;

const walkingRankings = networkNeighbourhoods.features
  .filter((neighbourhood) =>
    neighbourhood.properties.neighbourhood_name
      .toLowerCase()
      .includes(walkingSearch.trim().toLowerCase())
  )
  .sort((a, b) => {
    const aValue = a.properties[walkingCoverageKey];
    const bValue = b.properties[walkingCoverageKey];

    const aNumber =
      typeof aValue === "number" ? aValue : null;

    const bNumber =
      typeof bValue === "number" ? bValue : null;

    if (aNumber === null) return bNumber === null ? 0 : 1;
    if (bNumber === null) return -1;

    return walkingSort === "lowest"
      ? aNumber - bNumber
      : bNumber - aNumber;
  });

  const filteredSites = sites.filter((site) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      (site.properties.site_name ?? "")
        .toLowerCase()
        .includes(query) ||
      (site.properties.address ?? "")
        .toLowerCase()
        .includes(query);

    const matchesSource =
      sourceFilter === "all" ||
      site.properties.source === sourceFilter;

    const reportedAccessibility =
      site.properties.source === "crem"
        ? (site.properties.accessible_yes_count ?? 0) > 0
        : Boolean(
            site.properties.accessibility_features?.trim()
          );

    const matchesAccessibility =
      accessibilityFilter === "all" ||
      (accessibilityFilter === "reported" &&
        reportedAccessibility) ||
      (accessibilityFilter === "not_established" &&
        !reportedAccessibility);

    return (
      matchesSearch &&
      matchesSource &&
      matchesAccessibility
    );
  });

  const filteredGeoJSON: SiteCollection = {
    type: "FeatureCollection",
    features: filteredSites,
  };

  const selectedGeoJSON: SiteCollection = {
    type: "FeatureCollection",
    features: selectedSite ? [selectedSite] : [],
  };

  const selectedCremWashrooms =
    selectedSite?.properties.source === "crem"
      ? cremWashrooms.filter(
          (washroom) =>
            washroom.site_id ===
            selectedSite.properties.site_id
        )
      : [];

  const scenarioResult =
  mapMode === "scenario" && selectedNeighbourhood
    ? calculateScenario({
        neighbourhoodCode: String(
          selectedNeighbourhood.properties.neighbourhood_code
        ),
        neighbourhoodName:
          selectedNeighbourhood.properties.neighbourhood_name,
        populationEstimate: Number(
          selectedNeighbourhood.properties.population_2021_estimate
        ),
        existingSiteCount: Number(
          selectedNeighbourhood.properties.candidate_site_count
        ),
        hypotheticalSiteCount: hypotheticalSites,
      })
    : null;

const simulatedNeighbourhoodGeoJSON: NeighbourhoodCollection = {
  type: "FeatureCollection",
  features:
    mapMode === "scenario" && selectedNeighbourhood
      ? [selectedNeighbourhood]
      : [],
};

  const selectedNeighbourhoodGeoJSON: NeighbourhoodCollection =
    {
      type: "FeatureCollection",
      features: selectedNeighbourhood
        ? [selectedNeighbourhood]
        : [],
    };

  function handleSelectSite(site: Site) {
    setSelectedSite(site);

    mapRef.current?.flyTo({
      center: site.geometry.coordinates,
      zoom: 15,
      duration: 900,
      offset: [-120, 0],
    });
  }

  function handleSelectNeighbourhood(
    neighbourhood: NeighbourhoodFeature
  ) {
    setSelectedNeighbourhood(neighbourhood);
    fitNeighbourhood(mapRef.current, neighbourhood);
  }

  function changeMode(mode: MapMode) {
    setMapMode(mode);
    setSelectedSite(null);
    setSelectedNeighbourhood(null);
    setSelectedPark(null);
    setHypotheticalSites(1);

    if (mode !== "washrooms") {
      mapRef.current?.flyTo({
        center: [-79.3832, 43.72],
        zoom: 10,
        duration: 700,
      });
    }
  }

  const maxRate = Math.max(
    1,
    ...neighbourhoods.features.map(
      (feature) =>
        Number(
          feature.properties.sites_per_10000_residents
        ) || 0
    )
  );

  const formatNumber = (value: number) =>
    value.toLocaleString("en-CA");

  return (
    <div className="flex w-full flex-col md:h-[calc(100vh-80px)] md:flex-row">
        <aside className="flex h-[420px] min-h-0 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white md:h-full md:w-[360px]">
        <DashboardOverview
  sites={sites}
  neighbourhoods={neighbourhoods.features}
  loading={sitesLoading || neighbourhoodsLoading}
/>
<div className="min-h-0 flex-1 overflow-hidden">
        {mapMode === "washrooms" ? (
          <WashroomSidebar
            sites={filteredSites}
            totalSites={sites.length}
            search={search}
            onSearchChange={setSearch}
            sourceFilter={sourceFilter}
            onSourceChange={setSourceFilter}
            accessibilityFilter={accessibilityFilter}
            onAccessibilityChange={setAccessibilityFilter}
            onSelectSite={handleSelectSite}
          />
        ) : mapMode === "neighbourhoods" ? (
          <NeighbourhoodInsights
            neighbourhoods={neighbourhoods.features}
            selectedCode={
              selectedNeighbourhood
                ? String(
                    selectedNeighbourhood.properties
                      .neighbourhood_code
                  )
                : null
            }
            onSelectNeighbourhood={
              handleSelectNeighbourhood
            }
          />
        ) : mapMode === "walking" ? (
          <div className="h-full overflow-y-auto bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Walking Accessibility
            </h2>

<div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
  <h3 className="text-sm font-bold text-slate-900">
    Citywide Network Coverage
  </h3>

  <p className="mt-1 text-xs text-slate-500">
    Estimated share of mapped walking-network length within
    the selected walking threshold of recorded candidate sites.
  </p>

  <p className="mt-4 text-3xl font-bold text-slate-900">
    {citywideCoveragePct === null
      ? "—"
      : `${citywideCoveragePct.toFixed(2)}%`}
  </p>

  <p className="mt-1 text-xs text-slate-500">
    {citywideCoveragePct === null
      ? networkLoading
        ? "Loading network coverage..."
        : "Network coverage unavailable"
      : `${coveredNetworkKm.toLocaleString("en-CA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} km of ${totalNetworkKm.toLocaleString("en-CA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} km mapped network`}
  </p>
</div>

<details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
  <summary className="cursor-pointer text-sm font-semibold text-slate-900">
    Methodology & Data Limitations
  </summary>

  <div className="mt-3 space-y-3 text-xs leading-relaxed text-slate-600">
    <p>
      Walking coverage is estimated using Toronto's mapped
      pedestrian network and recorded candidate public washroom
      locations.
    </p>

    <p>
      Walking times assume a travel speed of 80 metres per minute.
      The 5-, 10-, and 15-minute results are preliminary
      network-distance estimates.
    </p>

    <p>
      Coverage percentages measure the proportion of mapped
      neighbourhood network length within the estimated walking
      threshold. They do not measure the percentage of residents
      who can reach a washroom.
    </p>

    <p>
      The analysis does not independently verify sidewalk
      continuity, crossings, barriers, wheelchair accessibility,
      washroom operating hours, or current facility availability.
    </p>

    <p className="font-medium text-slate-700">
      These results are intended for exploratory planning and
      should not be treated as verified accessible walking routes.
    </p>
  </div>
</details>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Explore estimated walking-network proximity
              to recorded public washroom candidate sites
              across Toronto neighbourhoods.
            </p>

            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-semibold text-slate-900">
                Walking-time threshold
              </legend>

              <div className="flex gap-2">
                {([5, 10, 15] as const).map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setWalkingMinutes(minutes)}
                    aria-pressed={walkingMinutes === minutes}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                      walkingMinutes === minutes
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </fieldset>

            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              Preliminary estimates based on 80 metres per
              minute and mapped network length. Routes,
              crossings, accessibility, and facility
              availability have not been independently
              verified. These values do not measure
              population coverage.
            </p>

            {networkLoading && (
              <p className="mt-4 text-sm text-slate-600">
                Loading walking-accessibility data...
              </p>
            )}

            {networkError && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {networkError}
              </p>
            )}

            {!networkLoading && !networkError && (
              <p className="mt-4 text-sm text-emerald-700">
                Loaded {networkNeighbourhoods.features.length} neighbourhoods.
              </p>
            )}
{!networkLoading && !networkError && (
  <section className="mt-6">
    <h3 className="text-sm font-bold text-slate-900">
      Neighbourhood Rankings
    </h3>

    <label
  htmlFor="walking-neighbourhood-search"
  className="mt-4 block text-xs font-semibold text-slate-600"
>
  Search neighbourhoods
</label>

<input
  id="walking-neighbourhood-search"
  type="search"
  value={walkingSearch}
  onChange={(event) => setWalkingSearch(event.target.value)}
  placeholder="Search by neighbourhood name..."
  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
/>

{/* ADD THE SORTING DROPDOWN HERE */}
<label
  htmlFor="walking-sort"
  className="mt-4 block text-xs font-semibold text-slate-600"
>
  Sort neighbourhoods
</label>

<select
  id="walking-sort"
  value={walkingSort}
  onChange={(event) =>
    setWalkingSort(event.target.value as "lowest" | "highest")
  }
  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
>
  <option value="lowest">Lowest coverage first</option>
  <option value="highest">Highest coverage first</option>
</select>

{/* KEEP THIS EXISTING PARAGRAPH */}
<p className="mt-2 text-xs text-slate-500">
  Showing {walkingRankings.length} of{" "}
  {networkNeighbourhoods.features.length} neighbourhoods
</p>

    <p className="mt-1 text-xs leading-relaxed text-slate-500">
      Lowest estimated {walkingMinutes}-minute network-length
      coverage first. Select a neighbourhood to explore it.
    </p>

    <div className="mt-4 space-y-2">
      {walkingRankings.map((neighbourhood, index) => {
        const coverage =
          neighbourhood.properties[walkingCoverageKey];

        const code = String(
          neighbourhood.properties.neighbourhood_code
        );

        const selected =
          selectedNeighbourhood !== null &&
          String(
            selectedNeighbourhood.properties.neighbourhood_code
          ) === code;

        return (
          <button
            key={code}
            type="button"
            onClick={() =>
              handleSelectNeighbourhood(neighbourhood)
            }
            aria-pressed={selected}
            className={`w-full rounded-xl border p-3 text-left transition ${
              selected
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-400">
                  #{index + 1}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {neighbourhood.properties.neighbourhood_name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {neighbourhood.properties.candidate_site_count}{" "}
                  recorded candidate sites
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-slate-900">
                  {typeof coverage === "number"
                    ? `${coverage.toFixed(1)}%`
                    : "N/A"}
                </p>

                <p className="text-[10px] text-slate-500">
                  Network length
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </section>
)}

          </div>
        ) : mapMode === "parks" ? (
          <div className="h-full overflow-y-auto bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Parks & Washrooms
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Explore park areas and their proximity to recorded candidate washroom sites.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Mapped parks</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {parks.features.length.toLocaleString("en-CA")}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">With internal candidates</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {parks.features.filter(p => Number(p.properties.internal_candidate_count) > 0).length.toLocaleString("en-CA")}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-900">
                Proximity overview
              </h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">No internal candidate recorded</dt>
                  <dd className="font-semibold text-amber-700">
                    {parks.features.filter(p => Number(p.properties.internal_candidate_count) === 0).length.toLocaleString("en-CA")}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">Over 1 km from nearest candidate</dt>
                  <dd className="font-semibold text-slate-900">
                    {parks.features.filter(p => Number(p.properties.nearest_site_distance_m) > 1000).length.toLocaleString("en-CA")}
                  </dd>
                </div>
              </dl>
            </div>

            {parksLoading && (
              <p className="mt-4 text-sm text-slate-600">
                Loading park data...
              </p>
            )}
            {parksError && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {parksError}
              </p>
            )}
            {!parksLoading && !parksError && (
              <p className="mt-4 text-sm text-emerald-700">
                Select a park on the map to inspect its details.
              </p>
            )}

            <p className="mt-5 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">
              Distances are straight-line estimates, not walking routes.
              Current facility availability has not been independently verified.
              No internal candidate does not mean a park has no public washroom.
            </p>
          </div>
        ) : (
          <ScenarioPlanner
            neighbourhoods={neighbourhoods.features}
            selectedCode={
              selectedNeighbourhood ? String (
                selectedNeighbourhood.properties.neighbourhood_code) : null
            }
            hypotheticalSites={hypotheticalSites}
            onHypotheticalSitesChange={setHypotheticalSites}
            onSelectNeighbourhood={
              handleSelectNeighbourhood
            }
          />
        )}
</div>
      </aside>

      <div className="relative h-[520px] min-h-0 min-w-0 flex-1 md:h-auto">
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={{
            longitude: -79.3832,
            latitude: 43.6532,
            zoom: 10.5,
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          style={{ width: "100%", height: "100%" }}
          interactiveLayerIds={
            mapMode === "washrooms"
              ? ["washroom-circles"]
              : mapMode === "parks"
                ? ["park-fill"]
                : ["neighbourhood-fill"]
          }
          onClick={(event) => {
            const feature = event.features?.[0];

            if (mapMode === "washrooms") {
              if (!feature) {
                setSelectedSite(null);
                return;
              }

              const site = filteredSites.find(
                (item) =>
                  item.properties.site_id ===
                  feature.properties?.site_id
              );

              if (site) {
                handleSelectSite(site);
              } else {
                setSelectedSite(null);
              }

              return;
            }

            if (mapMode === "parks") {
              if (!feature) {
                setSelectedPark(null);
                return;
              }

              const parkId = Number(feature.properties?.AREA_ID);

              const park = parks.features.find(
                (item) =>
                  Number(item.properties.AREA_ID) === parkId
              );

              setSelectedPark(park ?? null);

              if (park) {
                fitPark(mapRef.current, park);
              }

              return;
            }

            if (!feature) {
              setSelectedNeighbourhood(null);
              return;
            }

            const code = String(
              feature.properties?.AREA_SHORT_CODE
            );

            const neighbourhood =
              (mapMode === "walking" ? networkNeighbourhoods : neighbourhoods).features.find(
                (item) =>
                  String(
                    item.properties.AREA_SHORT_CODE
                  ) === code
              );

            setSelectedNeighbourhood(
              neighbourhood ?? null
            );
          }}
        >
          <NavigationControl position="top-right" />
          {mapMode === "parks" && parks.features.length > 0 && (
            <Source
              id="park-proximity"
              type="geojson"
              data={parks as GeoJSON.FeatureCollection}
            >
              <Layer
                id="park-fill"
                type="fill"
                paint={{
                  "fill-color": [
                    "case",
                    [">", ["get", "internal_candidate_count"], 0],
                    "#16856c",
                    "#e3a747",
                  ],
                  "fill-opacity": 0.55,
                }}
              />
              <Layer
                id="park-outline"
                type="line"
                paint={{
                  "line-color": "#334155",
                  "line-width": 0.7,
                  "line-opacity": 0.7,
                }}
              />
            </Source>
          )}


          {mapMode === "washrooms" && (
            <>
              <Source
                id="washroom-sites"
                type="geojson"
                data={filteredGeoJSON}
              >
                <Layer
                  id="washroom-circles"
                  type="circle"
                  paint={{
                    "circle-radius": 6,
                    "circle-color": [
                      "match",
                      ["get", "source"],
                      "parks",
                      "#059669",
                      "crem",
                      "#2563eb",
                      "#64748b",
                    ],
                    "circle-stroke-color": "#ffffff",
                    "circle-stroke-width": 2,
                  }}
                />
              </Source>

              <Source
                id="selected-washroom"
                type="geojson"
                data={selectedGeoJSON}
              >
                <Layer
                  id="selected-washroom-highlight"
                  type="circle"
                  paint={{
                    "circle-radius": 11,
                    "circle-color": "#f59e0b",
                    "circle-stroke-color": "#ffffff",
                    "circle-stroke-width": 3,
                  }}
                />
              </Source>
            </>
          )}

          {mapMode !== "washrooms" && mapMode !== "parks" && (
            <>
              <Source
                id="neighbourhood-coverage"
                type="geojson"
                data={
                  mapMode === "walking"
                    ? networkNeighbourhoods
                    : neighbourhoods 
                }

              >
                <Layer
                  id="neighbourhood-fill"
                  type="fill"
                  paint={{
                      "fill-color":
  mapMode === "walking"
    ? [
        "interpolate",
        ["linear"],
        [
          "to-number",
          [
            "get",
            `network_length_coverage_${walkingMinutes}min_pct`,
          ],
          0,
        ],
        0,
        "#fee2e2",
        25,
        "#fdba74",
        50,
        "#fde68a",
        75,
        "#86efac",
        100,
        "#15803d",
      ]
    : [
        "interpolate",
        ["linear"],
        [
          "to-number",
          ["get", "sites_per_10000_residents"],
          0,
        ],
        0,
        "#f4d5c8",
        0.5,
        "#f1b58f",
        1,
        "#e78a62",
        2,
        "#bd604c",
        4,
        "#7e3541",
      ],
      "fill-opacity": 0.72,
    }}
                />

                <Layer
                  id="neighbourhood-outline"
                  type="line"
                  paint={{
                    "line-color": "#475569",
                    "line-width": 0.65,
                    "line-opacity": 0.6,
                  }}
                />
              </Source>

              <Source
                id="selected-neighbourhood"
                type="geojson"
                data={selectedNeighbourhoodGeoJSON}
              >
                <Layer
                  id="selected-neighbourhood-outline"
                  type="line"
                  paint={{
                    "line-color": "#0f172a",
                    "line-width": 3,
                  }}
                />
              </Source>

              {mapMode === "scenario" &&
  scenarioResult?.simulatedRate !== null &&
  scenarioResult?.simulatedRate !== undefined && (
    <Source
      id="simulated-neighbourhood"
      type="geojson"
      data={simulatedNeighbourhoodGeoJSON}
    >
      <Layer
        id="simulated-neighbourhood-fill"
        type="fill"
        paint={{
          "fill-color": [
            "interpolate",
            ["linear"],
            ["literal", scenarioResult.simulatedRate],
            0,
            "#f4d5c8",
            0.5,
            "#f1b58f",
            1,
            "#e78a62",
            2,
            "#bd604c",
            4,
            "#7e3541",
          ],
          "fill-opacity": 0.85,
        }}
      />
      <Layer
        id="simulated-neighbourhood-outline"
        type="line"
        paint={{
          "line-color": "#1d4ed8",
          "line-width": 4,
        }}
      />
    </Source>
  )}
            </>
          )}
        </Map>

          <div className="absolute left-2 right-2 top-2 z-10 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-lg sm:left-3 sm:right-auto sm:top-3 sm:gap-2">
            <button
              type="button"
              onClick={() => changeMode("washrooms")}
              aria-pressed={mapMode === "washrooms"}
              className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition sm:flex-none sm:px-3 sm:text-sm ${
                mapMode === "washrooms"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="sm:hidden">Washrooms</span>
              <span className="hidden sm:inline">Washroom Explorer</span>
            </button>

            <button
              type="button"
              onClick={() => changeMode("neighbourhoods")}
              aria-pressed={mapMode === "neighbourhoods"}
              className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition sm:flex-none sm:px-3 sm:text-sm ${
                mapMode === "neighbourhoods"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="sm:hidden">Coverage</span>
              <span className="hidden sm:inline">Neighbourhood Coverage</span>
            </button>
{/* Walking Accessibility Button */}
<button
  type="button"
  onClick={() => changeMode("walking")}
  aria-pressed={mapMode === "walking"}
  className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition sm:flex-none sm:px-3 sm:text-sm ${
    mapMode === "walking"
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-100"
  }`}
>
  <span className="sm:hidden">Walking</span>
  <span className="hidden sm:inline">
    Walking Accessibility
  </span>
</button>

            <button
              type="button"
              onClick={() => changeMode("scenario")}
              aria-pressed={mapMode === "scenario"}
              className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition sm:flex-none sm:px-3 sm:text-sm ${
                mapMode === "scenario"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="sm:hidden">Planner</span>
              <span className="hidden sm:inline">Scenario Planner</span>
            </button>
            <button
              type="button"
              onClick={() => changeMode("parks")}
              aria-pressed={mapMode === "parks"}
              className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition sm:flex-none sm:px-3 sm:text-sm ${
                mapMode === "parks"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="sm:hidden">Parks</span>
              <span className="hidden sm:inline">Parks & Washrooms</span>
            </button>
          </div>

        {mapMode === "washrooms" && selectedSite && (
          <FacilityDetailsPanel
            key={selectedSite.properties.site_id}
            site={selectedSite}
            washrooms={selectedCremWashrooms}
            cremLoading={cremLoading}
            cremError={cremError}
            onClose={() => setSelectedSite(null)}
          />
        )}

        {mapMode === "parks" && selectedPark && (
          <div className="absolute bottom-3 left-3 right-3 z-10 max-h-[55%] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:bottom-auto sm:left-auto sm:right-5 sm:top-24 sm:w-[340px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Park infrastructure
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {selectedPark.properties.AREA_NAME}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPark(null)}
                aria-label="Close park details"
                className="rounded-lg px-2 py-1 text-lg text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Mapped park area
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {Number(selectedPark.properties.park_area_ha).toFixed(1)}
                <span className="ml-2 text-sm font-medium">hectares</span>
              </p>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">
                  Internal candidate sites
                </dt>
                <dd className="font-semibold text-slate-900">
                  {selectedPark.properties.internal_candidate_count}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">
                  Nearest recorded candidate
                </dt>
                <dd className="font-semibold text-slate-900">
                  {Number.isFinite(
                    selectedPark.properties.nearest_site_distance_m
                  )
                    ? selectedPark.properties.nearest_site_distance_m >= 1000
                      ? `${(selectedPark.properties.nearest_site_distance_m / 1000).toFixed(2)} km`
                      : `${Math.round(selectedPark.properties.nearest_site_distance_m)} m`
                    : "Unavailable"}
                </dd>
              </div>
            </dl>

            <p className="mt-5 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">
              Distances are straight-line estimates to recorded candidate
              sites, not walking routes. Candidate locations and current
              facility availability have not been independently verified.
              No internal candidate does not establish that a park has no
              public washroom.
            </p>
          </div>
        )}

        {mapMode === "neighbourhoods" &&
          selectedNeighbourhood && (
            <div className="absolute bottom-3 left-3 right-3 z-10 max-h-[55%] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:bottom-auto sm:left-auto sm:right-5 sm:top-24 sm:w-[340px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Neighbourhood coverage
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {
                      selectedNeighbourhood.properties
                        .neighbourhood_name
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedNeighbourhood(null)
                  }
                  aria-label="Close neighbourhood details"
                  className="rounded-lg px-2 py-1 text-lg text-slate-500 hover:bg-slate-100"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Recorded sites per 10,000 residents
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {Number(
                    selectedNeighbourhood.properties
                      .sites_per_10000_residents
                  ).toFixed(2)}
                </p>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">
                    Candidate sites
                  </dt>
                  <dd className="font-semibold text-slate-900">
                    {
                      selectedNeighbourhood.properties
                        .candidate_site_count
                    }
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">
                    Estimated population (2021)
                  </dt>
                  <dd className="font-semibold text-slate-900">
                    {formatNumber(
                      Number(
                        selectedNeighbourhood.properties
                          .population_2021_estimate
                      )
                    )}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">
                    Sites with accessibility evidence
                  </dt>
                  <dd className="font-semibold text-slate-900">
                    {
                      selectedNeighbourhood.properties
                        .accessibility_reported_site_count
                    }
                  </dd>
                </div>
              </dl>

              <p className="mt-5 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">
                Coverage is based on recorded Parks and
                CREM candidate sites and a 2021
                census-based population estimate.
                Accessibility evidence is not independent
                verification. A zero count does not mean
                no public washrooms exist.
              </p>
            </div>
          )}

{mapMode === "walking" && selectedNeighbourhood && (
  <div className="absolute bottom-3 left-3 right-3 z-10 max-h-[55%] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:bottom-auto sm:left-auto sm:right-5 sm:top-24 sm:w-[340px]">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Walking network coverage
        </p>

        <h2 className="mt-1 text-lg font-bold text-slate-900">
          {selectedNeighbourhood.properties.neighbourhood_name}
        </h2>
      </div>

      <button
        type="button"
        onClick={() => setSelectedNeighbourhood(null)}
        aria-label="Close walking coverage details"
        className="rounded-lg px-2 py-1 text-lg text-slate-500 hover:bg-slate-100"
      >
        ×
      </button>
    </div>

    <div className="mt-5 rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">
        Within {walkingMinutes} minutes
      </p>

    <p className="mt-1 text-3xl font-bold text-slate-900">
  {Number(
    selectedNeighbourhood.properties[
      `network_length_coverage_${walkingMinutes}min_pct` as
        | "network_length_coverage_5min_pct"
        | "network_length_coverage_10min_pct"
        | "network_length_coverage_15min_pct"
    ] ?? 0
  ).toFixed(1)}
  %
</p>

      <p className="mt-1 text-xs text-slate-500">
        Of mapped neighbourhood network length
      </p>
    </div>

    <dl className="mt-4 space-y-3 text-sm">
      {([5, 10, 15] as const).map((minutes) => {
        const key =
          `network_length_coverage_${minutes}min_pct` as
            | "network_length_coverage_5min_pct"
            | "network_length_coverage_10min_pct"
            | "network_length_coverage_15min_pct";

        const value =
          selectedNeighbourhood.properties[key];

        return (
          <div
            key={minutes}
            className="flex justify-between gap-4"
          >
            <dt className="text-slate-500">
              Within {minutes} minutes
            </dt>
            <dd className="font-semibold text-slate-900">
              {typeof value === "number"
                ? `${value.toFixed(1)}%`
                : "N/A"}
            </dd>
          </div>
        );
      })}

      <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
        <dt className="text-slate-500">
          Mapped network length
        </dt>
        <dd className="font-semibold text-slate-900">
          {Number(
            selectedNeighbourhood.properties.network_length_km ?? 0
          ).toFixed(1)}{" "}
          km
        </dd>
      </div>

      <div className="flex justify-between gap-4">
        <dt className="text-slate-500">
          Recorded candidate sites
        </dt>
        <dd className="font-semibold text-slate-900">
          {selectedNeighbourhood.properties.candidate_site_count}
        </dd>
      </div>
    </dl>

    <p className="mt-5 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">
      Preliminary network-length estimates using an assumed
      walking speed of 80 metres per minute. Routes,
      crossings, facility availability, and wheelchair
      accessibility are not verified. These percentages
      do not represent population coverage.
    </p>
  </div>
)}
{mapMode === "walking" && selectedNeighbourhood && (
  <div className="absolute bottom-3 left-3 right-3 z-10 max-h-[55%] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:bottom-auto sm:left-auto sm:right-5 sm:top-24 sm:w-[340px]">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Walking network coverage
        </p>

        <h2 className="mt-1 text-lg font-bold text-slate-900">
          {selectedNeighbourhood.properties.neighbourhood_name}
        </h2>
      </div>

      <button
        type="button"
        onClick={() => setSelectedNeighbourhood(null)}
        aria-label="Close walking coverage details"
        className="rounded-lg px-2 py-1 text-lg text-slate-500 hover:bg-slate-100"
      >
        ×
      </button>
    </div>

    <div className="mt-5 rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">
        Within {walkingMinutes} minutes
      </p>

<p className="mt-1 text-3xl font-bold text-slate-900">
  {(() => {
    const key = `network_length_coverage_${walkingMinutes}min_pct` as
      | "network_length_coverage_5min_pct"
      | "network_length_coverage_10min_pct"
      | "network_length_coverage_15min_pct";

    const value = selectedNeighbourhood.properties[key];

    return typeof value === "number"
      ? `${value.toFixed(1)}%`
      : "N/A";
  })()}
</p>

      <p className="mt-1 text-xs text-slate-500">
        Of mapped neighbourhood network length
      </p>
    </div>

    <dl className="mt-4 space-y-3 text-sm">
      {([5, 10, 15] as const).map((minutes) => {
        const key =
          `network_length_coverage_${minutes}min_pct` as
            | "network_length_coverage_5min_pct"
            | "network_length_coverage_10min_pct"
            | "network_length_coverage_15min_pct";

        const value =
          selectedNeighbourhood.properties[key];

        return (
          <div
            key={minutes}
            className="flex justify-between gap-4"
          >
            <dt className="text-slate-500">
              Within {minutes} minutes
            </dt>
            <dd className="font-semibold text-slate-900">
              {typeof value === "number"
                ? `${value.toFixed(1)}%`
                : "N/A"}
            </dd>
          </div>
        );
      })}

      <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
        <dt className="text-slate-500">
          Mapped network length
        </dt>
        <dd className="font-semibold text-slate-900">
          {Number(
            selectedNeighbourhood.properties.network_length_km ?? 0
          ).toFixed(1)}{" "}
          km
        </dd>
      </div>

      <div className="flex justify-between gap-4">
        <dt className="text-slate-500">
          Recorded candidate sites
        </dt>
        <dd className="font-semibold text-slate-900">
          {selectedNeighbourhood.properties.candidate_site_count}
        </dd>
      </div>
    </dl>

    <p className="mt-5 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">
      Preliminary network-length estimates using an assumed
      walking speed of 80 metres per minute. Routes,
      crossings, facility availability, and wheelchair
      accessibility are not verified. These percentages
      do not represent population coverage.
    </p>
  </div>
)}
        {mapMode === "washrooms" && sitesLoading && (
          <div className="absolute left-5 top-20 rounded-lg bg-white p-3 text-sm shadow-lg">
            Loading washroom locations...
          </div>
        )}

        {(mapMode === "neighbourhoods" ||
          mapMode === "scenario") &&
          neighbourhoodsLoading && (
            <div className="absolute left-5 top-20 rounded-lg bg-white p-3 text-sm shadow-lg">
              Loading neighbourhood coverage...
            </div>
          )}

        {mapMode === "washrooms" && error && (
          <div
            role="alert"
            className="absolute bottom-20 left-5 rounded-lg bg-white p-4 text-sm text-red-600 shadow-lg"
          >
            {error}
          </div>
        )}

        {(mapMode === "neighbourhoods" ||
          mapMode === "scenario") &&
          neighbourhoodError && (
            <div
              role="alert"
              className="absolute bottom-20 left-5 rounded-lg bg-white p-4 text-sm text-red-600 shadow-lg"
            >
              {neighbourhoodError}
            </div>
          )}

        {mapMode === "washrooms" ? (
          <div className="pointer-events-none absolute bottom-5 right-5 rounded-xl bg-white p-3 text-slate-900 shadow-lg">
            <p className="mb-2 text-xs font-semibold">
              Washroom locations
            </p>

            <div className="flex items-center gap-2 text-xs">
              <span className="h-3 w-3 rounded-full bg-emerald-600" />
              Parks

              <span className="ml-2 h-3 w-3 rounded-full bg-blue-600" />
              CREM
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {filteredSites.length} candidate sites
            </p>
          </div>
        ) : mapMode === "parks" ? (
  <div className={`pointer-events-none absolute bottom-5 max-w-[290px] rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-lg ${selectedPark ? "left-5 right-auto" : "right-5"}`}>
    <p className="text-sm font-bold">Park & washroom proximity</p>

    <div className="mt-3 flex items-start gap-2 text-xs">
      <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm bg-emerald-600" />
      <span>
        <strong>Internal candidate recorded</strong>
        <span className="mt-0.5 block text-slate-500">
          At least one recorded candidate site falls within the park polygon.
        </span>
      </span>
    </div>

    <div className="mt-3 flex items-start gap-2 text-xs">
      <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm bg-amber-500" />
      <span>
        <strong>No internal candidate recorded</strong>
        <span className="mt-0.5 block text-slate-500">
          This does not establish that the park has no public washroom.
        </span>
      </span>
    </div>

    <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">
      Nearest-site distances are straight-line estimates, not walking routes.
      Facility availability has not been independently verified.
    </p>
  </div>
        ) : mapMode === "walking" ? (
  <div className="pointer-events-none absolute bottom-5 right-5 max-w-[260px] rounded-xl bg-white p-4 text-slate-900 shadow-lg">
    <p className="text-xs font-semibold">
      Estimated {walkingMinutes}-minute network coverage
    </p>

    <div
      className="mt-3 h-3 w-full rounded"
      style={{
        background:
          "linear-gradient(to right, #fee2e2, #fdba74, #fde68a, #86efac, #15803d)",
      }}
    />

    <div className="mt-1 flex justify-between text-xs text-slate-500">
      <span>0%</span>
      <span>25%</span>
      <span>50%</span>
      <span>75%</span>
      <span>100%</span>
    </div>

    <p className="mt-3 text-xs leading-relaxed text-slate-500">
      Percentage of mapped network length within
      {` ${walkingMinutes} minutes`} of a recorded
      candidate washroom.
    </p>

    <p className="mt-2 text-xs text-slate-500">
      Preliminary model · Not population coverage
    </p>
  </div>
) : (
          <div className="pointer-events-none absolute bottom-5 right-5 rounded-xl bg-white p-4 text-slate-900 shadow-lg">
            <p className="text-xs font-semibold">
              Sites per 10,000 residents
            </p>

            <div
              className="mt-3 h-3 w-52 rounded"
              style={{
                background:
                  "linear-gradient(to right, #f4d5c8, #f1b58f, #e78a62, #bd604c, #7e3541)",
              }}
            />

            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>0</span>
              <span>0.5</span>
              <span>1</span>
              <span>2</span>
              <span>4+</span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {neighbourhoods.features.length} neighbourhoods
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Maximum observed: {maxRate.toFixed(2)}
            </p>
{mapMode === "scenario" && (
  <div className="mt-2 border-t border-slate-200 pt-2 text-xs">
    <p className="font-semibold text-blue-700">
      Blue outline = simulated neighbourhood
    </p>

    {scenarioResult ? (
      <p className="mt-1 text-slate-600">
        Existing: {scenarioResult.existingRate?.toFixed(2) ?? "N/A"}
        {" → "}
        Simulated: {scenarioResult.simulatedRate?.toFixed(2) ?? "N/A"}
      </p>
    ) : (
      <p className="mt-1 text-slate-500">
        Select a neighbourhood to preview a scenario.
      </p>
    )}

    <p className="mt-1 text-slate-500">
      Other neighbourhoods show recorded coverage.
      No facility locations are proposed.
    </p>
  </div>
)}
          </div>
        )}
      </div>
    </div>
  );
}
