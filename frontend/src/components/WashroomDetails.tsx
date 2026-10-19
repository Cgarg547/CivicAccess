
"use client";

import { useState } from "react";

export type CremWashroom = {
  record_id: string;
  site_id: string;
  washroom_info: string | null;
  location_details: string | null;
  accessible_washroom: string | null;
  gender_inclusive: string | null;
  hours_available: string | null;
  washroom_status: string | null;
};

type Props = {
  washrooms: CremWashroom[];
};

export default function WashroomDetails({ washrooms }: Props) {
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  const filtered = accessibleOnly
    ? washrooms.filter(
        (washroom) => washroom.accessible_washroom === "Yes"
      )
    : washrooms;

  if (washrooms.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No individual washroom records are available.
      </p>
    );
  }

  return (
    <section className="mt-3 border-t border-slate-200 pt-3">
      <h4 className="text-sm font-bold text-slate-900">
        Individual washrooms ({washrooms.length})
      </h4>

      <label className="mt-2 flex items-center gap-2 text-xs text-slate-700">
        <input
          type="checkbox"
          checked={accessibleOnly}
          onChange={(event) =>
            setAccessibleOnly(event.target.checked)
          }
        />
        Show only washrooms marked accessible
      </label>

      <p className="mt-1 text-xs text-slate-500">
        Showing {filtered.length} of {washrooms.length} records
      </p>

      <div className="mt-3 space-y-3">
        {filtered.map((washroom) => {
          const restricted =
            washroom.washroom_status !== "Open - Public Access";

          return (
            <article
              key={washroom.record_id}
              className="rounded-lg border border-slate-200 p-3"
            >
              <h5 className="text-sm font-semibold text-slate-900">
                {washroom.washroom_info ?? "Washroom"}
              </h5>

              <p className="mt-1 text-xs text-slate-600">
                <strong>Location:</strong>{" "}
                {washroom.location_details ?? "Not reported"}
              </p>

              <p className="mt-2 text-xs text-slate-700">
                <strong>Accessible:</strong>{" "}
                {washroom.accessible_washroom ?? "Not reported"}
              </p>

              <p className="mt-1 text-xs text-slate-700">
                <strong>Gender-inclusive:</strong>{" "}
                {washroom.gender_inclusive ?? "Not reported"}
              </p>

              <p className="mt-2 text-xs text-slate-600">
                <strong>Hours:</strong>{" "}
                {washroom.hours_available ?? "Not reported"}
              </p>

              {restricted && (
                <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-800">
                  Access status:{" "}
                  {washroom.washroom_status ?? "Not reported"}
                </p>
              )}

              {!restricted && (
                <p className="mt-2 text-xs text-emerald-700">
                  Source status: Open - Public Access
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
