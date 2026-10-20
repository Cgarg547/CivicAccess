
"use client";

import WashroomDetails, {
  type CremWashroom,
} from "./WashroomDetails";

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

type Props = {
  site: Site;
  washrooms: CremWashroom[];
  cremLoading: boolean;
  cremError: string | null;
  onClose: () => void;
};

export default function FacilityDetailsPanel({
  site,
  washrooms,
  cremLoading,
  cremError,
  onClose,
}: Props) {
  const p = site.properties;
  const isCrem = p.source === "crem";

  const accessibilityReported = isCrem
    ? (p.accessible_yes_count ?? 0) > 0
    : Boolean(p.accessibility_features?.trim());

  return (
    <aside
      aria-label="Selected washroom facility details"
      className="absolute inset-x-0 bottom-0 z-20 flex max-h-[75%] flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:w-[390px] md:max-h-none md:rounded-2xl"
    >
      {/* Fixed panel header */}
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 p-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {isCrem ? "CREM facility" : "Toronto Parks"}
          </p>

          <h2 className="mt-1 text-lg font-bold leading-snug">
            {p.site_name ?? "Unnamed washroom site"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {p.address ?? "Address unavailable"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close facility details"
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Close
        </button>
      </header>

      {/* Scrollable panel content */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              accessibilityReported
                ? "bg-emerald-50 text-emerald-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {accessibilityReported
              ? "Accessibility reported"
              : "Accessibility not established"}
          </span>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
            {p.source_record_count} record(s)
          </span>
        </div>

        <section className="mt-5">
          <h3 className="text-sm font-bold">Accessibility</h3>

          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {p.accessibility_summary ??
              "Accessibility information not reported"}
          </p>

          {p.accessibility_features && (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <strong>Reported features:</strong>{" "}
              {p.accessibility_features}
            </p>
          )}

          {isCrem && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xl font-bold text-emerald-800">
                  {p.accessible_yes_count ?? "—"}
                </p>
                <p className="text-xs text-emerald-900">
                  Marked accessible
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-3">
                <p className="text-xl font-bold text-slate-800">
                  {p.accessible_no_count ?? "—"}
                </p>
                <p className="text-xs text-slate-700">
                  Marked not accessible
                </p>
              </div>
            </div>
          )}

          {isCrem && (
            <p className="mt-3 text-xs text-slate-500">
              Gender-inclusive washroom records:{" "}
              {p.gender_inclusive_yes_count ?? "Not reported"}
            </p>
          )}
        </section>

        <section className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-bold">Operating hours</h3>

          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
            {p.hours_summary ?? "Hours not reported"}
          </p>

          {isCrem && (
            <p className="mt-2 text-xs text-slate-500">
              Hours may differ between individual washrooms.
            </p>
          )}
        </section>

        <section className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-bold">
            Source-reported status
          </h3>

          <p className="mt-2 text-sm text-slate-700">
            {p.status_summary ?? "Status not reported"}
          </p>

          {!isCrem && (p.status_reason_raw || p.status_comments_raw) && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-950">
                Source-reported maintenance notice
              </p>

              {p.status_reason_raw && (
                <p className="mt-2 text-sm text-amber-900">
                  Reason: {p.status_reason_raw}
                </p>
              )}

              {p.posted_date_raw && (
                <p className="mt-1 text-xs text-amber-800">
                  Source posting date: {p.posted_date_raw}
                </p>
              )}

              {p.status_comments_raw && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-amber-950">
                  {p.status_comments_raw}
                </p>
              )}

              <p className="mt-3 text-xs leading-relaxed text-amber-900">
                This is a source-reported notice, not live verification
                of the facility's current condition or closure status.
              </p>
            </div>
          )}

          {(p.restricted_access_count ?? 0) > 0 && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              {p.restricted_access_count} record(s) have
              passenger-only access restrictions.
            </p>
          )}
        </section>

        {isCrem && (
          <section className="mt-5 border-t border-slate-200 pt-4">
            {cremLoading ? (
              <p className="text-sm text-slate-500">
                Loading individual washrooms...
              </p>
            ) : cremError ? (
              <p role="alert" className="text-sm text-red-600">
                {cremError}
              </p>
            ) : (
              <WashroomDetails
                key={p.site_id}
                washrooms={washrooms}
              />
            )}
          </section>
        )}

        <p className="mt-6 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
          This information comes from published datasets.
          It does not verify live availability, accessibility,
          or current opening conditions.
        </p>
      </div>
    </aside>
  );
}
