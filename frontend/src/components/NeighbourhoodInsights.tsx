
"use client";

import { useMemo, useState } from "react";

export type NeighbourhoodProperties = {
  AREA_SHORT_CODE: number | string;
  neighbourhood_name: string;
  neighbourhood_code: number | string;
  candidate_site_count: number | string;
  parks_site_count: number | string;
  crem_site_count: number | string;
  accessibility_reported_site_count: number | string;
  population_2021_estimate: number;
  sites_per_10000_residents: number;

  // Preliminary network-length accessibility metrics.
  // Optional because older neighbourhood datasets
  // may not include these properties.
  network_length_km?: number;
  network_length_within_5min_km?: number;
  network_length_within_10min_km?: number;
  network_length_within_15min_km?: number;
  network_length_coverage_5min_pct?: number | null;
  network_length_coverage_10min_pct?: number | null;
  network_length_coverage_15min_pct?: number | null;
  network_length_method?: string;
};

export type NeighbourhoodFeature = {
  type: "Feature";
  properties: NeighbourhoodProperties;
  geometry: GeoJSON.Geometry;
};

type Props = {
  neighbourhoods: NeighbourhoodFeature[];
  selectedCode: string | null;
  onSelectNeighbourhood: (
    neighbourhood: NeighbourhoodFeature
  ) => void;
};

const formatNumber = (value: number) =>
  value.toLocaleString("en-CA");

export default function NeighbourhoodInsights({
  neighbourhoods,
  selectedCode,
  onSelectNeighbourhood,
}: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"lowest" | "highest">(
    "lowest"
  );

  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  const sorted = useMemo(() => {
    const query = search.trim().toLowerCase();

    return neighbourhoods
      .filter((item) =>
        item.properties.neighbourhood_name
          .toLowerCase()
          .includes(query)
      )
      .sort((a, b) => {
        const aRate = Number(
          a.properties.sites_per_10000_residents
        );

        const bRate = Number(
          b.properties.sites_per_10000_residents
        );

        const difference =
          sort === "lowest"
            ? aRate - bRate
            : bRate - aRate;

        return (
          difference ||
          a.properties.neighbourhood_name.localeCompare(
            b.properties.neighbourhood_name
          )
        );
      });
  }, [neighbourhoods, search, sort]);

  const alphabetical = useMemo(
    () =>
      [...neighbourhoods].sort((a, b) =>
        a.properties.neighbourhood_name.localeCompare(
          b.properties.neighbourhood_name
        )
      ),
    [neighbourhoods]
  );

  const neighbourhoodA = alphabetical.find(
    (item) =>
      String(item.properties.neighbourhood_code) ===
      compareA
  );

  const neighbourhoodB = alphabetical.find(
    (item) =>
      String(item.properties.neighbourhood_code) ===
      compareB
  );

  function metric(
    item: NeighbourhoodFeature | undefined,
    key: keyof NeighbourhoodProperties,
    decimals = 0
  ) {
    if (!item) return "—";

    const value = Number(item.properties[key]);

    if (!Number.isFinite(value)) return "—";

    return decimals > 0
      ? value.toFixed(decimals)
      : formatNumber(value);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-slate-900">
      <div className="shrink-0 border-b border-slate-200 p-5">
        <h2 className="text-lg font-bold">
          Neighbourhood Insights
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Compare recorded candidate washroom sites
          across Toronto neighbourhoods.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        <section>
          <h3 className="mb-3 text-sm font-semibold">
            Coverage rankings
          </h3>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search neighbourhoods..."
            aria-label="Search neighbourhoods"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={sort}
            onChange={(event) =>
              setSort(
                event.target.value as "lowest" | "highest"
              )
            }
            aria-label="Sort coverage rankings"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="lowest">
              Lowest recorded coverage first
            </option>
            <option value="highest">
              Highest recorded coverage first
            </option>
          </select>

          <p className="my-3 text-xs text-slate-500">
            Showing {sorted.length} of{" "}
            {neighbourhoods.length} neighbourhoods
          </p>

          {neighbourhoods.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No neighbourhood data loaded yet.
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No neighbourhoods match your search.
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {sorted.map((item, index) => {
                const p = item.properties;
                const code = String(
                  p.neighbourhood_code
                );

                const active = selectedCode === code;

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() =>
                      onSelectNeighbourhood(item)
                    }
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      active
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400">
                          #{index + 1}
                        </p>

                        <p className="text-sm font-semibold">
                          {p.neighbourhood_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {p.candidate_site_count} recorded sites
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {Number(
                            p.sites_per_10000_residents
                          ).toFixed(2)}
                        </p>

                        <p className="text-[10px] text-slate-500">
                          per 10k residents
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold">
            Compare two neighbourhoods
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Choose two neighbourhoods to compare
            their recorded coverage indicators.
          </p>

          <div className="mt-3 space-y-2">
            {[
              {
                label: "Neighbourhood A",
                value: compareA,
                setter: setCompareA,
              },
              {
                label: "Neighbourhood B",
                value: compareB,
                setter: setCompareB,
              },
            ].map((field) => (
              <label
                key={field.label}
                className="block text-xs font-medium"
              >
                {field.label}

                <select
                  value={field.value}
                  onChange={(event) =>
                    field.setter(event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">
                    Select neighbourhood
                  </option>

                  {alphabetical.map((item) => (
                    <option
                      key={String(
                        item.properties.neighbourhood_code
                      )}
                      value={String(
                        item.properties.neighbourhood_code
                      )}
                    >
                      {item.properties.neighbourhood_name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {neighbourhoodA && neighbourhoodB && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 text-left">
                      Metric
                    </th>
                    <th className="px-2 py-2 text-right">
                      A
                    </th>
                    <th className="py-2 text-right">
                      B
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {[
                    {
                      label: "Population estimate",
                      key: "population_2021_estimate",
                    },
                    {
                      label: "Candidate sites",
                      key: "candidate_site_count",
                    },
                    {
                      label: "Parks sites",
                      key: "parks_site_count",
                    },
                    {
                      label: "CREM sites",
                      key: "crem_site_count",
                    },
                    {
                      label: "Sites with accessibility evidence",
                      key: "accessibility_reported_site_count",
                    },
                    {
                      label: "Sites per 10k residents",
                      key: "sites_per_10000_residents",
                      decimals: 2,
                    },
                  ].map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-slate-100"
                    >
                      <td className="py-2 pr-2">
                        {row.label}
                      </td>

                      <td className="px-2 py-2 text-right font-semibold">
                        {metric(
                          neighbourhoodA,
                          row.key as keyof NeighbourhoodProperties,
                          row.decimals
                        )}
                      </td>

                      <td className="py-2 text-right font-semibold">
                        {metric(
                          neighbourhoodB,
                          row.key as keyof NeighbourhoodProperties,
                          row.decimals
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
          Rankings use recorded Parks and CREM candidate
          sites divided by 2021 census-based population
          estimates. Missing facilities in these sources
          may exist elsewhere. Reported accessibility
          evidence is not independent verification.
        </p>
      </div>
    </div>
  );
}
