
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

        <section className="mt-10 rounded-2xl border border-blue-200 bg-white p-7">
          <h2 className="text-2xl font-bold">
            Technical Validation &amp; Reproducibility
          </h2>

          <p className="mt-4 leading-relaxed text-slate-600">
            CivicAccess documents its data-integrity checks, geographic
            validation, pedestrian-network connectivity, and walking-coverage
            reproducibility. The published walking-coverage GeoJSON was
            reproduced exactly using the current inputs and calculation script.
          </p>

          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            These checks establish consistency and reproducibility, not
            independently verified washroom availability, safe walking routes,
            or physical accessibility.
          </p>

          <a
            href="https://github.com/Cgarg547/CivicAccess/blob/main/docs/technical_validation_report.md"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
          >
            Read the Technical Validation Report ↗
          </a>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              value: "367",
              label: "Recorded candidate sites",
            },
            {
              value: "158",
              label: "Toronto neighbourhoods",
            },
            {
              value: "474",
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
            <a href="https://open.toronto.ca/dataset/washroom-facilities/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">View official Toronto Open Data source ↗</a>
            <p className="mt-2 leading-relaxed text-slate-600">
              Provides recorded washroom locations associated
              with Toronto parks and recreation facilities.
              CivicAccess includes 355 candidate sites from
              this source. Available attributes may include
              location information and reported accessibility
              features.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold">
              CREM Public Washrooms
            </h3>
            <a href="https://open.toronto.ca/dataset/corporate-real-estate-management-portfolio-washrooms/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">View official Toronto Open Data source ↗</a>
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
            <a href="https://open.toronto.ca/dataset/neighbourhoods/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">View official Toronto Open Data source ↗</a>
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
            <a href="https://open.toronto.ca/dataset/neighbourhood-profiles/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">View official Toronto Open Data source ↗</a>
            <p className="mt-2 leading-relaxed text-slate-600">
              Population denominators come from the
              census-based 2021 neighbourhood profile
              indicator for total age groups of the population,
              using 25% sample data. These values are
              historical estimates, not current population
              counts.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
  <h3 className="text-lg font-semibold">
    Toronto Pedestrian Network
  </h3>
            <a href="https://open.toronto.ca/dataset/pedestrian-network/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">View official Toronto Open Data source ↗</a>

  <p className="mt-2 leading-relaxed text-slate-600">
    CivicAccess uses Toronto's mapped pedestrian-network
    data to estimate walking-network coverage around
    recorded candidate public washroom sites.
  </p>

  <p className="mt-3 leading-relaxed text-slate-600">
    Network-distance estimates use an assumed walking
    speed of 80 metres per minute and are evaluated at
    5-, 10-, and 15-minute thresholds.
  </p>

  <p className="mt-3 text-sm leading-relaxed text-slate-500">
    This is a preliminary network model. The source data
    and analysis do not establish continuous sidewalks,
    safe crossings, barrier-free routes, or verified
    wheelchair accessibility.
  </p>
</div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold">Toronto Green Spaces</h3>
            <a
              href="https://open.toronto.ca/dataset/green-spaces/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline"
            >
              View official Toronto Open Data source ↗
            </a>
            <p className="mt-2 leading-relaxed text-slate-600">
              Provides park boundaries used in the Parks &amp; Washrooms
              Explorer to analyze 1,628 unique parks, identify candidate
              sites within park boundaries, and calculate straight-line
              distances to the nearest recorded candidate site.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-slate-600">
            Data sources: City of Toronto Open Data, licensed under the{" "}
            <a
              href="https://open.toronto.ca/open-data-license/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-700 hover:underline"
            >
              Open Government Licence – Toronto
            </a>.
            CivicAccess is an independent analysis and is not endorsed
            by the City of Toronto. Original dataset retrieval dates
            have not been verified.
          </p>
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
              geographic dataset of 367 candidate sites.
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
    Walking Accessibility methodology
  </h2>

  <p className="mt-4 leading-relaxed text-slate-600">
    CivicAccess provides preliminary walking-network coverage
    estimates for Toronto's 158 neighbourhoods using recorded
    candidate public washroom sites and mapped pedestrian-network
    data.
  </p>

  <h3 className="mt-6 text-lg font-semibold">
    How walking coverage is estimated
  </h3>

  <ol className="mt-3 list-decimal space-y-3 pl-5 leading-relaxed text-slate-600">
    <li>
      Recorded candidate washroom sites are associated with
      the mapped pedestrian network.
    </li>
    <li>
      Preliminary network distances are estimated using
      a walking speed of 80 metres per minute.
    </li>
    <li>
      The analysis evaluates 5-, 10-, and 15-minute
      walking-distance thresholds.
    </li>
    <li>
      For each neighbourhood, the length of mapped network
      within each threshold is compared with its total
      mapped network length.
    </li>
  </ol>

  <div className="mt-6 rounded-xl bg-slate-100 px-5 py-6 text-center text-sm font-semibold sm:text-base">
    (Mapped network length within walking threshold ÷
    Total mapped neighbourhood network length) × 100
  </div>

  <h3 className="mt-7 text-lg font-semibold">
    Citywide results
  </h3>

  <div className="mt-4 overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead className="border-b border-slate-200 text-slate-700">
        <tr>
          <th className="py-3 pr-4">Walking threshold</th>
          <th className="py-3 pr-4">Network length</th>
          <th className="py-3">Coverage</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100 text-slate-600">
        <tr>
          <td className="py-3 pr-4">5 minutes</td>
          <td className="py-3 pr-4">909.48 km</td>
          <td className="py-3">11.33%</td>
        </tr>
        <tr>
          <td className="py-3 pr-4">10 minutes</td>
          <td className="py-3 pr-4">3,179.99 km</td>
          <td className="py-3">39.63%</td>
        </tr>
        <tr>
          <td className="py-3 pr-4">15 minutes</td>
          <td className="py-3 pr-4">5,315.63 km</td>
          <td className="py-3">66.25%</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p className="mt-4 text-sm text-slate-500">
    Total mapped network length: approximately 8,024.02 km.
    Citywide percentages are weighted by network length,
    rather than calculated as simple averages of neighbourhood
    percentages.
  </p>

  <h3 className="mt-7 text-lg font-semibold">
    Interpretation and limitations
  </h3>

  <p className="mt-3 leading-relaxed text-slate-600">
    These results describe the estimated share of mapped
    pedestrian-network length near recorded candidate sites.
    They do not measure the percentage of Toronto residents
    who can access a public washroom.
  </p>

  <p className="mt-3 leading-relaxed text-slate-600">
    The underlying network analysis is preliminary. Sidewalk
    continuity, crossings, physical barriers, wheelchair
    accessibility, and site-to-network connections have not
    been independently verified.
  </p>

  <p className="mt-3 leading-relaxed text-slate-600">
    The source pedestrian network contains disconnected
    components and may omit real-world connections. For
    example, the Billy Bishop Toronto City Airport pedestrian
    tunnel is documented in the airport's 2022 map but is
    not represented as a connecting route in the network
    used by CivicAccess. The analysis preserves this
    disconnection rather than assuming an unverified route.
    Disconnected network segments do not necessarily mean
    that locations are physically inaccessible.
  </p>

  <p className="mt-3 font-medium leading-relaxed text-slate-800">
    Walking-network coverage should not be interpreted as
    verified accessible routing or guaranteed availability
    of public washrooms.
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


        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-7">
          <h2 className="text-2xl font-bold">
            Parks &amp; Washrooms methodology
          </h2>

          <p className="mt-4 leading-relaxed text-slate-600">
            CivicAccess examines 1,628 unique park features from
            Toronto&apos;s Green Spaces dataset. Parks are selected
            using the source classification AREA_CLASS = Park and
            unique AREA_ID identifiers.
          </p>

          <p className="mt-3 leading-relaxed text-slate-600">
            These parks are compared with 367 recorded candidate
            public washroom sites from the included datasets.
          </p>

          <h3 className="mt-6 text-lg font-semibold">
            How park proximity is calculated
          </h3>

          <ul className="mt-3 list-disc space-y-3 pl-5 leading-relaxed text-slate-600">
            <li>
              Park area is recorded in hectares.
            </li>
            <li>
              Internal candidate counts include recorded washroom
              points inside or on each park boundary.
            </li>
            <li>
              Nearest-site distance is the shortest straight-line
              distance between the park polygon and any recorded
              candidate washroom point.
            </li>
            <li>
              Geographic distances are calculated in metres using
              the EPSG:26917 projected coordinate system.
            </li>
          </ul>

          <h3 className="mt-6 text-lg font-semibold">
            Independent validation
          </h3>

          <p className="mt-3 leading-relaxed text-slate-600">
            All 1,628 parks were checked against the 367 candidate
            sites. The validation reproduced every recorded
            nearest-site distance within 0.01 metres and every
            internal candidate count without a mismatch.
          </p>

          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            This validation confirms consistency with the
            processed candidate-site dataset. It does not
            independently verify facility locations, operating
            conditions, or public accessibility.
          </p>

          <p className="mt-3 font-medium leading-relaxed text-slate-800">
            Park proximity is not walking distance or travel time.
            A nearby recorded site is not necessarily open,
            reachable, accessible, or available to the public.
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
