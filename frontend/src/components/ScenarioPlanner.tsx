
"use client";

import { useMemo } from "react";

import {
  calculateScenario,
  type ScenarioResult,
} from "../lib/scenarioPlanner";

import type {
  NeighbourhoodFeature,
} from "./NeighbourhoodInsights";

type Props = {
  neighbourhoods: NeighbourhoodFeature[];
  selectedCode: string | null;
  hypotheticalSites: number;
  onHypotheticalSitesChange: (value: number) => void;
  onSelectNeighbourhood?: (
    neighbourhood: NeighbourhoodFeature
  ) => void;
};

function formatRate(value: number | null): string {
  return value === null ? "N/A" : value.toFixed(2);
}

function formatChange(value: number | null): string {
  if (value === null) return "N/A";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

export default function ScenarioPlanner({
  neighbourhoods,
  selectedCode,
  hypotheticalSites,
  onHypotheticalSitesChange,
  onSelectNeighbourhood,
}: Props) {
  const activeCode = selectedCode ?? "";

  const alphabetical = useMemo(
    () =>
      [...neighbourhoods].sort((a, b) =>
        a.properties.neighbourhood_name.localeCompare(
          b.properties.neighbourhood_name
        )
      ),
    [neighbourhoods]
  );

  const selectedNeighbourhood = alphabetical.find(
    (item) =>
      String(item.properties.neighbourhood_code) ===
      activeCode
  );

  const result: ScenarioResult | null = useMemo(() => {
    if (!selectedNeighbourhood) return null;

    const properties = selectedNeighbourhood.properties;

    return calculateScenario({
      neighbourhoodCode: String(
        properties.neighbourhood_code
      ),
      neighbourhoodName: properties.neighbourhood_name,
      populationEstimate: Number(
        properties.population_2021_estimate
      ),
      existingSiteCount: Number(
        properties.candidate_site_count
      ),
      hypotheticalSiteCount: hypotheticalSites,
    });
  }, [selectedNeighbourhood, hypotheticalSites]);

  function buildScenarioSummary(): string {
  if (!result) return "";

  const existingRate = formatRate(result.existingRate);
  const simulatedRate = formatRate(result.simulatedRate);
  const rateChange = formatChange(result.rateChange);

  return [
    "CivicAccess — Infrastructure Scenario Summary",
    "",
    `Neighbourhood: ${result.neighbourhoodName}`,
    `Population: ${result.populationEstimate.toLocaleString("en-CA")} (2021 census-based estimate)`,
    `Existing recorded candidate sites: ${result.existingSiteCount}`,
    `Hypothetical additional sites: ${result.hypotheticalSiteCount}`,
    `Simulated total sites: ${result.simulatedSiteCount}`,
    "",
    "Coverage per 10,000 residents:",
    `Existing: ${existingRate}`,
    `Simulated: ${simulatedRate}`,
    `Change: ${rateChange}`,
    "",
    "Methodology: The scenario adds hypothetical sites to the",
    "recorded Parks and CREM candidate-site count while holding",
    "the 2021 population estimate constant.",
    "",
    "Planning simulation only. Additional sites are not real",
    "facilities, funded projects, or confirmed construction.",
    "This scenario does not evaluate site feasibility, accessibility,",
    "operating hours, or walking-distance access.",
  ].join("\n");
}

  function handleNeighbourhoodChange(code: string) {
    const selected = alphabetical.find(
      (item) =>
        String(item.properties.neighbourhood_code) === code
    );

    if (selected) {
      onSelectNeighbourhood?.(selected);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-slate-900">
      <div className="shrink-0 border-b border-slate-200 p-5">
        <h2 className="text-lg font-bold">
          Infrastructure Scenario Planner
        </h2>

        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Explore how hypothetical additional public
          washroom sites would change recorded site
          coverage across Toronto neighbourhoods.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <section>
          <label
            htmlFor="scenario-neighbourhood"
            className="text-sm font-semibold"
          >
            Select neighbourhood
          </label>

          <select
            id="scenario-neighbourhood"
            value={activeCode}
            onChange={(event) =>
              handleNeighbourhoodChange(event.target.value)
            }
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
          >
            <option value="">
              Choose a neighbourhood
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
        </section>

        <section className="rounded-xl border border-slate-200 p-4">
          <label
            htmlFor="additional-sites"
            className="text-sm font-semibold"
          >
            Hypothetical additional sites
          </label>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                onHypotheticalSitesChange(
                  Math.max(0, hypotheticalSites - 1)
                )
              }
              disabled={hypotheticalSites === 0}
              className="rounded-lg border border-slate-300 px-4 py-2 text-lg font-semibold disabled:opacity-40"
              aria-label="Remove hypothetical site"
            >
              −
            </button>

            <input
              id="additional-sites"
              type="number"
              min={0}
              max={100}
              step={1}
              value={hypotheticalSites}
              onChange={(event) => {
                const value = Number(event.target.value);

                if (Number.isFinite(value)) {
                  onHypotheticalSitesChange(
                    Math.max(
                      0,
                      Math.min(100, Math.trunc(value)))
                  );
                }
              }}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-lg font-bold"
            />

            <button
              type="button"
              onClick={() =>
                onHypotheticalSitesChange (
                  Math.min(100, hypotheticalSites + 1)
                )
              }
              disabled={hypotheticalSites === 100}
              className="rounded-lg border border-slate-300 px-4 py-2 text-lg font-semibold disabled:opacity-40"
              aria-label="Add hypothetical site"
            >
              +
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Add between 0 and 100 hypothetical sites.
            This does not create real facilities.
          </p>

          <button
  type="button"
  onClick={() => onHypotheticalSitesChange(0)}
  disabled={hypotheticalSites === 0}
  className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
>
  Reset hypothetical additions to 0
</button>

        </section>

        {result ? (
          <>
            <section>
              <h3 className="mb-3 text-sm font-semibold">
                Scenario results
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-100 p-4">
                  <p className="text-xs text-slate-500">
                    Existing recorded sites
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {result.existingSiteCount}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs text-blue-700">
                    Simulated total sites
                  </p>
                  <p className="mt-2 text-2xl font-bold text-blue-900">
                    {result.simulatedSiteCount}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Sites per 10,000 residents
                </p>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      Existing
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {formatRate(result.existingRate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-blue-700">
                      Simulated
                    </p>
                    <p className="mt-1 text-2xl font-bold text-blue-800">
                      {formatRate(result.simulatedRate)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-500">
                    Change in coverage rate
                  </p>
                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    {formatChange(result.rateChange)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Percentage change:{" "}
                    {result.percentageChange === null
                      ? "N/A (zero baseline or population)"
                      : `+${result.percentageChange.toFixed(1)}%`}
                  </p>
                </div>
              </div>
            </section>

<section className="rounded-xl border border-slate-200 p-4">
  <h3 className="text-sm font-semibold text-slate-900">
    Before vs. After
  </h3>

  <p className="mt-1 text-xs leading-relaxed text-slate-500">
    Recorded and simulated washroom-site coverage
    per 10,000 residents.
  </p>

  {result.existingRate !== null &&
  result.simulatedRate !== null ? (
    <div className="mt-5 space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-slate-600">
            Existing coverage
          </span>
          <span className="font-bold text-slate-900">
            {result.existingRate.toFixed(2)}
          </span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-500 transition-all duration-300"
            style={{
              width: `${
                result.simulatedRate > 0
                  ? (result.existingRate /
                      result.simulatedRate) *
                    100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-blue-700">
            Simulated coverage
          </span>
          <span className="font-bold text-blue-800">
            {result.simulatedRate.toFixed(2)}
          </span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${
                result.simulatedRate > 0 ? 100 : 0
              }%`,
            }}
          />
        </div>
      </div>

      <p className="border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">
        Both bars use the same scale, with the simulated
        coverage rate as the maximum. This is a
        hypothetical site-count comparison, not a
        walking-accessibility prediction.
      </p>
    </div>
  ) : (
    <p className="mt-3 text-sm text-slate-500">
      Coverage rates are unavailable because the
      population denominator is zero.
    </p>
  )}
</section>

<section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
  <h3 className="text-sm font-semibold text-blue-900">
    Scenario Summary
  </h3>

  <p className="mt-2 text-xs leading-relaxed text-blue-800">
    Copy a summary of this hypothetical infrastructure
    scenario for your report or presentation.
  </p>

  <button
    type="button"
    onClick={async () => {
      try {
        await navigator.clipboard.writeText(
          buildScenarioSummary()
        );

        window.alert("Scenario summary copied!");
      } catch {
        window.alert(
          "Unable to copy automatically. Please check clipboard permissions."
        );
      }
    }}
    className="mt-4 w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
  >
    Copy Scenario Summary
  </button>
</section>

            <section className="rounded-xl bg-slate-50 p-4">
              <h3 className="text-sm font-semibold">
                Population denominator
              </h3>

              <p className="mt-2 text-sm text-slate-700">
                {result.populationEstimate.toLocaleString(
                  "en-CA"
                )}{" "}
                estimated residents (2021)
              </p>
            </section>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            Select a neighbourhood to calculate a
            hypothetical infrastructure scenario.
          </div>
        )}

        <p className="border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
          <strong>Planning simulation only.</strong>{" "}
          Hypothetical sites are not existing facilities,
          funded projects, or confirmed construction.
          Calculations use recorded Parks and CREM
          candidate sites and a fixed 2021 census-based
          population estimate. Site-count changes do not
          establish accessibility, operating hours,
          feasibility, or walking-distance access.
        </p>
      </div>
    </div>
  );
}
