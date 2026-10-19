
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

type MapMode = "washrooms" | "neighbourhoods" | "scenario";

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

export default function CivicAccessMap() {
  const mapRef = useRef<MapRef>(null);

  const [mapMode, setMapMode] =
    useState<MapMode>("washrooms");

  const [sites, setSites] = useState<Site[]>([]);

  const [cremWashrooms, setCremWashrooms] =
    useState<CremWashroom[]>([]);

  const [neighbourhoods, setNeighbourhoods] =
    useState<NeighbourhoodCollection>(
      EMPTY_NEIGHBOURHOODS
    );

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

  const [hypotheticalSites, setHypotheticalSites] = useState(1);

  const [sitesLoading, setSitesLoading] = useState(true);
  const [cremLoading, setCremLoading] = useState(true);
  const [neighbourhoodsLoading, setNeighbourhoodsLoading] =
    useState(true);

  const [error, setError] = useState<string | null>(null);
  const [cremError, setCremError] =
    useState<string | null>(null);
  const [neighbourhoodError, setNeighbourhoodError] =
    useState<string | null>(null);

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
    <div className="flex h-[calc(100vh-80px)] w-full flex-col md:flex-row">
        <aside className="flex h-64 min-h-0 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white md:h-full md:w-[360px]">
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

      <div className="relative min-h-0 min-w-0 flex-1">
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

            if (!feature) {
              setSelectedNeighbourhood(null);
              return;
            }

            const code = String(
              feature.properties?.AREA_SHORT_CODE
            );

            const neighbourhood =
              neighbourhoods.features.find(
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

          {mapMode !== "washrooms" && (
            <>
              <Source
                id="neighbourhood-coverage"
                type="geojson"
                data={neighbourhoods}
              >
                <Layer
                  id="neighbourhood-fill"
                  type="fill"
                  paint={{
                    "fill-color": [
                      "interpolate",
                      ["linear"],
                      [
                        "to-number",
                        [
                          "get",
                          "sites_per_10000_residents",
                        ],
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

          <div className="absolute left-2 right-2 top-2 z-10 flex gap-1 rounded-xl bg-white p-1 shadow-lg sm:left-3 sm:right-auto sm:top-3 sm:gap-2">
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

        {mapMode === "washrooms" && sitesLoading && (
          <div className="absolute left-5 top-20 rounded-lg bg-white p-3 text-sm shadow-lg">
            Loading washroom locations...
          </div>
        )}

        {mapMode !== "washrooms" &&
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

        {mapMode !== "washrooms" &&
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
