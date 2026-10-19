
import Link from "next/link";
import CivicAccessMap from "@/components/CivicAccessMap";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            CivicAccess
          </h1>

          <p className="text-sm text-slate-500">
            Toronto Public Washroom Accessibility Explorer
          </p>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex items-center gap-4"
        >
          <Link
            href="/about"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            About the Data
          </Link>

          <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 sm:inline-block">
            Toronto, Canada
          </span>
        </nav>
      </header>

      <CivicAccessMap />
    </main>
  );
}
