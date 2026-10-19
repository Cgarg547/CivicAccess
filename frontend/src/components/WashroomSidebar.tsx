
"use client";

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

export type AccessibilityFilter =
  | "all"
  | "reported"
  | "not_established";

type Props = {
  sites: Site[];
  totalSites: number;

  search: string;
  onSearchChange: (value: string) => void;

  sourceFilter: "all" | "parks" | "crem";
  onSourceChange: (
    value: "all" | "parks" | "crem"
  ) => void;

  accessibilityFilter: AccessibilityFilter;
  onAccessibilityChange: (
    value: AccessibilityFilter
  ) => void;

  onSelectSite: (site: Site) => void;
};

function hasReportedAccessibility(site: Site): boolean {
  if (site.properties.source === "crem") {
    return (
      (site.properties.accessible_yes_count ?? 0) > 0
    );
  }

  return Boolean(
    site.properties.accessibility_features?.trim()
  );
}

export default function WashroomSidebar({
  sites,
  totalSites,
  search,
  onSearchChange,
  sourceFilter,
  onSourceChange,
  accessibilityFilter,
  onAccessibilityChange,
  onSelectSite,
}: Props) {
  return (
      <aside className="flex h-full min-h-0 w-full flex-col overflow-y-auto border-r border-slate-200 bg-white text-slate-900">
      {/* Search and filters */}
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-bold">
          Find a washroom
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Explore Toronto public washroom locations
        </p>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search by name or address"
          aria-label="Search washrooms"
          className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
        />

        {/* Source filter */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Data source
          </p>

          <div className="flex flex-wrap gap-2">
            {(["all", "parks", "crem"] as const).map(
              (source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() =>
                    onSourceChange(source)
                  }
                  aria-pressed={
                    sourceFilter === source
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    sourceFilter === source
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {source === "all"
                    ? "All"
                    : source === "parks"
                      ? "Parks"
                      : "CREM"}
                </button>
              )
            )}
          </div>
        </div>

        {/* Accessibility filter */}
        <div className="mt-5">
          <label
            htmlFor="accessibility-filter"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Accessibility information
          </label>

          <select
            id="accessibility-filter"
            value={accessibilityFilter}
            onChange={(event) =>
              onAccessibilityChange(
                event.target.value as AccessibilityFilter
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="all">
              All locations
            </option>

            <option value="reported">
              Reported accessibility
            </option>

            <option value="not_established">
              Accessibility not established
            </option>
          </select>

          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Reported accessibility means the source
            identifies accessibility features or at
            least one accessible washroom. It is not
            an independent accessibility verification.
          </p>
        </div>

        {/* Results count */}
        <p
          aria-live="polite"
          className="mt-4 text-sm font-medium text-slate-600"
        >
          Showing {sites.length} of {totalSites} candidate
          sites
        </p>
      </div>

      {/* Search results */}
      <div className="shrink-0">
        {sites.length === 0 && (
          <p className="p-5 text-sm text-slate-500">
            No washroom sites match your filters.
          </p>
        )}

        {sites.map((site) => {
          const reported =
            hasReportedAccessibility(site);

          return (
            <button
              key={site.properties.site_id}
              type="button"
              onClick={() => onSelectSite(site)}
              className="w-full border-b border-slate-100 p-5 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
            >
              <div className="flex items-start gap-3">
                {/* Source indicator */}
                <span
                  className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${
                    site.properties.source === "parks"
                      ? "bg-emerald-600"
                      : "bg-blue-600"
                  }`}
                />

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">
                    {site.properties.site_name ??
                      "Unnamed site"}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {site.properties.address ??
                      "Address unavailable"}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {site.properties.source === "parks"
                      ? "Parks"
                      : "CREM"}
                    {" · "}
                    {
                      site.properties
                        .source_record_count
                    }{" "}
                    record(s)
                  </p>

                  {/* Accessibility indicator */}
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                      reported
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {reported
                      ? "Accessibility reported"
                      : "Accessibility not established"}
                  </span>

                  {reported &&
                    site.properties.source ===
                      "crem" && (
                      <p className="mt-1 text-xs text-slate-500">
                        {
                          site.properties
                            .accessible_yes_count
                        }{" "}
                        washroom record(s) marked
                        accessible
                      </p>
                    )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
