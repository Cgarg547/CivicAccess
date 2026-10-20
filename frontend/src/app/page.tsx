
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

      <section
        aria-labelledby="project-introduction"
        className="border-b border-slate-200 bg-white px-6 py-5"
      >
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">
            Toronto Open Data · Civic Infrastructure
          </p>

          <h2
            id="project-introduction"
            className="max-w-4xl text-xl font-bold tracking-tight text-slate-900 md:text-2xl"
          >
            Understanding public washroom access across Toronto
          </h2>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 md:text-base">
            CivicAccess brings together public washroom records,
            neighbourhood population data, and pedestrian-network
            analysis to help explore infrastructure distribution
            and hypothetical improvements.
          </p>

          <div className="mt-4 grid max-w-4xl grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {[
              { value: "367", label: "Candidate sites" },
              { value: "158", label: "Neighbourhoods" },
              { value: "474", label: "Washroom records" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-3 max-w-4xl text-xs leading-5 text-slate-500">
            Independent exploratory project. Recorded candidate sites
            are not verified currently operating facilities.
            Walking-accessibility estimates measure mapped network
            length, not population access.
          </p>
        </div>
      </section>

      <CivicAccessMap />

      <section
        id="research-findings"
        aria-labelledby="research-findings-heading"
        className="border-t border-slate-200 bg-white px-6 py-12"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Evidence from Toronto Open Data
          </p>

          <h2
            id="research-findings-heading"
            className="mt-2 text-2xl font-bold tracking-tight text-slate-900"
          >
            What the data reveals
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            CivicAccess combines recorded public washroom sites,
            neighbourhood boundaries and population data, and
            pedestrian-network modelling to highlight infrastructure
            patterns worth investigating.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                value: "26 of 158",
                title: "Neighbourhoods with no recorded candidate sites",
                description:
                  "These neighbourhoods have no candidate sites in the combined datasets. This does not prove that no usable washrooms exist.",
              },
              {
                value: "11.33%",
                title: "Network length within an estimated 5-minute walk",
                description:
                  "The share of mapped pedestrian-network length estimated to be within five minutes of a recorded candidate site.",
              },
              {
                value: "66.25%",
                title: "Network length within an estimated 15-minute walk",
                description:
                  "The estimated share of mapped pedestrian-network length reachable within fifteen minutes. This is not a population-access estimate.",
              },
            ].map((finding) => (
              <article
                key={finding.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >
                <p className="text-3xl font-bold tracking-tight text-blue-700">
                  {finding.value}
                </p>

                <h3 className="mt-3 text-base font-semibold text-slate-900">
                  {finding.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {finding.description}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-6 max-w-4xl text-xs leading-6 text-slate-500">
            Findings reflect the current processed datasets and modelling
            assumptions. Candidate sites are not verified as operating,
            and walking estimates describe network length rather than
            the proportion of residents with access.
          </p>

          <Link
            href="/about"
            className="mt-5 inline-flex text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
          >
            Read the methodology and limitations →
          </Link>
        </div>
      </section>

      <section
        id="practical-applications"
        aria-labelledby="practical-applications-heading"
        className="border-t border-slate-200 bg-slate-50 px-6 py-12"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Turning Evidence Into Action
          </p>

          <h2
            id="practical-applications-heading"
            className="mt-2 text-2xl font-bold tracking-tight text-slate-900"
          >
            From Data to Decisions
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            CivicAccess helps residents, researchers, and planners
            explore where additional investigation or infrastructure
            improvements may be valuable.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Identify potential service gaps",
                description:
                  "Compare recorded candidate sites across Toronto neighbourhoods to identify areas that may warrant further investigation.",
              },
              {
                number: "02",
                title: "Examine walking-network reach",
                description:
                  "Explore estimated five-, ten-, and fifteen-minute walking-network coverage to understand geographic differences in modelled accessibility.",
              },
              {
                number: "03",
                title: "Explore hypothetical improvements",
                description:
                  "Use the Scenario Planner to examine how additional candidate locations could affect neighbourhood site-density indicators.",
              },
            ].map((item) => (
              <article
                key={item.number}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <p className="text-sm font-bold text-blue-700">
                  {item.number}
                </p>

                <h3 className="mt-3 text-base font-semibold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-6 max-w-4xl text-xs leading-6 text-slate-500">
            These applications support exploratory analysis, not
            verified facility availability, population-level access
            estimates, or formal infrastructure recommendations.
            Additional field verification and accessibility assessment
            would be required before making planning decisions.
          </p>
        </div>
      </section>
    </main>
  );
}
