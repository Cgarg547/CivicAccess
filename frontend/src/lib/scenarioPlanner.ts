
export type ScenarioInput = {
  neighbourhoodCode: string;
  neighbourhoodName: string;
  populationEstimate: number;
  existingSiteCount: number;
  hypotheticalSiteCount: number;
};

export type ScenarioResult = {
  neighbourhoodCode: string;
  neighbourhoodName: string;
  populationEstimate: number;
  existingSiteCount: number;
  hypotheticalSiteCount: number;
  simulatedSiteCount: number;
  existingRate: number | null;
  simulatedRate: number | null;
  rateChange: number | null;
  percentageChange: number | null;
};

function isNonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function calculateRate(
  siteCount: number,
  population: number
): number {
  return (siteCount / population) * 10000;
}

export function calculateScenario(
  input: ScenarioInput
): ScenarioResult {
  const {
    neighbourhoodCode,
    neighbourhoodName,
    populationEstimate,
    existingSiteCount,
    hypotheticalSiteCount,
  } = input;

  if (!isNonNegativeInteger(existingSiteCount)) {
    throw new Error(
      "Existing site count must be a non-negative integer."
    );
  }

  if (!isNonNegativeInteger(hypotheticalSiteCount)) {
    throw new Error(
      "Hypothetical site count must be a non-negative integer."
    );
  }

  if (
    !Number.isFinite(populationEstimate) ||
    populationEstimate < 0
  ) {
    throw new Error(
      "Population estimate must be a non-negative number."
    );
  }

  const simulatedSiteCount =
    existingSiteCount + hypotheticalSiteCount;

  if (!Number.isSafeInteger(simulatedSiteCount)) {
    throw new Error(
      "Combined site count exceeds the supported range."
    );
  }

  // A zero population denominator cannot produce
  // a meaningful per-resident coverage rate.
  if (populationEstimate === 0) {
    return {
      neighbourhoodCode,
      neighbourhoodName,
      populationEstimate,
      existingSiteCount,
      hypotheticalSiteCount,
      simulatedSiteCount,
      existingRate: null,
      simulatedRate: null,
      rateChange: null,
      percentageChange: null,
    };
  }

  const existingRate = calculateRate(
    existingSiteCount,
    populationEstimate
  );

  const simulatedRate = calculateRate(
    simulatedSiteCount,
    populationEstimate
  );

  const rateChange = simulatedRate - existingRate;

  // Percentage change is undefined when the
  // original rate is zero.
  const percentageChange =
    existingRate === 0
      ? null
      : (rateChange / existingRate) * 100;

  return {
    neighbourhoodCode,
    neighbourhoodName,
    populationEstimate,
    existingSiteCount,
    hypotheticalSiteCount,
    simulatedSiteCount,
    existingRate,
    simulatedRate,
    rateChange,
    percentageChange,
  };
}
