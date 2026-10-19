
"use client";

import { useMemo, useState } from "react";

type SiteFeature = {
  properties: {
    site_id: string;
    source: "parks" | "crem";
    source_record_count: number;
  };
};

type NeighbourhoodFeature = {
  properties: {
    neighbourhood_code: string | number;
    candidate_site_count: string | number;
  };
};

type Props = {
  sites: SiteFeature[];
  neighbourhoods: NeighbourhoodFeature[];
  loading?: boolean;
};

export default function DashboardOverview({
  sites,
  neighbourhoods,
  loading = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => {
    const uniqueSiteIds = new Set(
      sites.map((site) => site.properties.site_id)
    );

    const totalRecords = sites.reduce(
      (sum, site) =>
        sum + Number(site.properties.source_record_count || 0),
      0
    );

    const zeroSiteNeighbourhoods = neighbourhoods.filter(
      (neighbourhood) =>
        Number(neighbourhood.properties.candidate_site_count) === 0
    ).length;

    return {
      sites: uniqueSiteIds.size,
      neighbourhoods: neighbourhoods.length,
      zeroSiteNeighbourhoods,
      records: totalRecords,
    };
  }, [sites, neighbourhoods]);

  const cards = [
    {
      label: "Recorded candidate sites",
      value: stats.sites,
      detail: "Parks and CREM sites",
    },
    {
      label: "Toronto neighbourhoods",
      value: stats.neighbourhoods,
      detail: "Neighbourhood coverage analysis",
    },
    {
      label: "No recorded candidate sites",
      value: stats.zeroSiteNeighbourhoods,
      detail: "Neighbourhoods in included datasets",
    },
    {
      label: "Underlying washroom records",
      value: stats.records,
      detail: "Records represented by sites",
    },
  ];

  return (
    <section
      aria-label="Toronto washroom coverage overview"
      className="shrink-0 border-b border-slate-200 bg-white"
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-controls="coverage-overview-details"
        className="w-full px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">
              Toronto Coverage Overview
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {loading
                ? "Loading coverage statistics..."
                : `${stats.sites} sites · ${stats.neighbourhoods} neighbourhoods · ${stats.zeroSiteNeighbourhoods} with no recorded sites`}
            </p>
          </div>

          <span
            aria-hidden="true"
            className={`shrink-0 text-lg text-slate-500 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          >
            ⌄
          </span>
        </div>
      </button>

      {expanded && (
        <div
          id="coverage-overview-details"
          className="max-h-[45vh] overflow-y-auto px-4 pb-4"
        >
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-xs leading-snug text-slate-600">
                  {card.label}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : card.value.toLocaleString("en-CA")}
                </p>

                <p className="mt-1 text-[11px] leading-snug text-slate-500">
                  {card.detail}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            These figures describe recorded candidate locations,
            not a verified inventory of all publicly accessible
            or currently operating washrooms in Toronto.
          </p>
        </div>
      )}
    </section>
  );
}
