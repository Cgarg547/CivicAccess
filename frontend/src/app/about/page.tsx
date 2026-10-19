
import Link from "next/link";

export const metadata = {
  title: "About the Data | CivicAccess",
  description:
    "Data sources, methodology, and limitations of CivicAccess.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Link
          href="/"
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          ← Back to CivicAccess
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Data transparency
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            About CivicAccess
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
            CivicAccess is an exploratory tool for understanding
            recorded public washroom infrastructure across Toronto.
            It combines municipal datasets, neighbourhood-level
            population estimates, and hypothetical planning
            scenarios to support transparent discussion of
            public washroom coverage.
          </p>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              value: "366",
              label: "Recorded candidate sites",
            },
            {
              value: "158",
              label: "Toronto neighbourhoods",
            },
            {
              value: "473",
              label: "Underlying washroom records",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-600">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-12 space-y-5">
          <h2 className="text-2xl font-bold">Data sources</h2>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold">
              Toronto Parks Washroom Facilities
            </h3>
            <p className="mt-2 leading-relaxed text-slate-600">
              Provides recorded washroom locations associated
              with Toronto parks and recreation facilities.
              CivicAccess includes 354 candidate sites from
              this source. Available attributes may include
              location information and reported accessibility
              features.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold">
              CREM Public Washrooms
            </h3>
            <p className="mt-2 leading-relaxed text-slate-600">
              Provides 119 individual washroom records associated
              with 12 building sites. CivicAccess groups these
              records by site while preserving individual
              washroom details, including source-reported
              accessibility and gender-inclusive indicators.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold">
              Toronto Neighbourhoods
            </h3>
            <p className="mt-2 leading-relaxed text-slate-600">
              The analysis uses Toronto's 158 neighbourhood
              boundaries to group recorded candidate sites
              geographically and calculate neighbourhood-level
              statistics.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold">
              2021 Neighbourhood Profiles
            </h3>
            <p className="mt-2 leading-relaxed text-slate-600">
              Population denominators come from the
              census-based 2021 neighbourhood profile
              indicator for total age groups of the population,
              using 25% sample data. These values are
              historical estimates, not current population
              counts.
            </p>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-7">
          <h2 className="text-2xl font-bold">
            How the data is processed
          </h2>

          <ol className="mt-5 list-decimal space-y-4 pl-5 leading-relaxed text-slate-600">
            <li>
              Source washroom records are standardized into
              a common site format.
            </li>
            <li>
              CREM individual washroom records are grouped
              into their associated building sites.
            </li>
            <li>
              Parks and CREM sites are combined into a
              geographic dataset of 366 candidate sites.
            </li>
            <li>
              Candidate sites are assigned to Toronto
              neighbourhood boundaries.
            </li>
            <li>
              Site counts are combined with 2021
              neighbourhood population estimates to
              calculate comparable coverage rates.
            </li>
          </ol>

          <p className="mt-5 text-sm leading-relaxed text-slate-500">
            Three possible cross-source duplicate pairs were
            identified for review, but were not automatically
            merged. The published candidate-site count should
            not be interpreted as a fully deduplicated or
            independently verified inventory.
          </p>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-7">
          <h2 className="text-2xl font-bold">
            Neighbourhood coverage methodology
          </h2>

          <p className="mt-4 leading-relaxed text-slate-600">
            CivicAccess calculates recorded candidate sites
            per 10,000 residents using:
          </p>

          <div className="mt-5 rounded-xl bg-slate-100 px-5 py-6 text-center text-sm font-semibold sm:text-lg">
            (Recorded candidate sites ÷ 2021 population estimate)
            × 10,000
          </div>

          <p className="mt-5 leading-relaxed text-slate-600">
            Of the 158 neighbourhoods, 26 contain no recorded
            candidate sites from the included datasets.
            This does not prove that those neighbourhoods
            have no public washrooms.
          </p>

          <p className="mt-3 leading-relaxed text-slate-600">
            These rates measure recorded site counts relative
            to population. They do not measure walking
            distance, travel time, facility capacity,
            availability, or equitable access.
          </p>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-7">
          <h2 className="text-2xl font-bold">
            Understanding accessibility information
          </h2>

          <p className="mt-4 leading-relaxed text-slate-600">
            CivicAccess distinguishes locations with
            source-reported accessibility information from
            locations where accessibility has not been
            established in the included records.
          </p>

          <p className="mt-3 leading-relaxed text-slate-600">
            For CREM sites, reported accessibility means
            at least one individual washroom record is marked
            accessible. It does not establish that every
            washroom in the building is accessible.
          </p>

          <p className="mt-3 leading-relaxed text-slate-600">
            For Parks sites, reported accessibility means
            the source contains a nonempty accessibility
            features field. The information has not been
            independently verified.
          </p>

          <p className="mt-3 font-medium leading-relaxed text-slate-800">
            Missing accessibility information does not mean
            that a facility is inaccessible.
          </p>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-7">
          <h2 className="text-2xl font-bold">
            Infrastructure Scenario Planner
          </h2>

          <p className="mt-4 leading-relaxed text-slate-600">
            The Scenario Planner allows users to add a
            hypothetical number of candidate sites to a
            selected neighbourhood and calculate the
            resulting site-count coverage rate.
          </p>

          <p className="mt-3 leading-relaxed text-slate-600">
            The calculation holds the 2021 population
            estimate constant. It does not select actual
            construction locations, identify feasible sites,
            estimate costs, or predict changes in
            walking-distance accessibility.
          </p>

          <p className="mt-3 font-medium leading-relaxed text-slate-800">
            Simulated sites are not existing facilities,
            funded projects, or confirmed construction plans.
          </p>
        </section>

        <section className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-7">
          <h2 className="text-xl font-bold text-amber-950">
            Important limitations
          </h2>

          <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-amber-950">
            <li>
              The included datasets may not represent
              every public washroom in Toronto.
            </li>
            <li>
              Recorded locations and attributes may be
              incomplete or outdated.
            </li>
            <li>
              Facility operating status and public
              availability are not independently verified.
            </li>
            <li>
              Unverified Parks status codes are not
              interpreted as confirmed open or closed.
            </li>
            <li>
              Neighbourhood rates use 2021 census-based
              population estimates.
            </li>
            <li>
              Recorded site density is not equivalent
              to geographic or accessible service coverage.
            </li>
          </ul>
        </section>

        <footer className="mt-12 border-t border-slate-200 pt-6">
          <p className="text-sm leading-relaxed text-slate-500">
            CivicAccess is an independent exploratory
            open-data project. Its findings should be
            interpreted alongside official source records
            and additional field verification.
          </p>

          <Link
            href="/"
            className="mt-5 inline-block text-sm font-semibold text-blue-700 hover:underline"
          >
            ← Return to interactive map
          </Link>
        </footer>
      </div>
    </main>
  );
}
