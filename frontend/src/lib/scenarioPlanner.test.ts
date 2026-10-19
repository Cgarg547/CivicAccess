
import { calculateScenario } from "./scenarioPlanner";

function assert(
  condition: boolean,
  message: string
): void {
  if (!condition) {
    throw new Error(`Test failed: ${message}`);
  }
}

function approximatelyEqual(
  actual: number | null,
  expected: number
): boolean {
  return (
    actual !== null &&
    Math.abs(actual - expected) < 0.000001
  );
}

const result = calculateScenario({
  neighbourhoodCode: "TEST",
  neighbourhoodName: "Example Neighbourhood",
  populationEstimate: 20000,
  existingSiteCount: 2,
  hypotheticalSiteCount: 3,
});

assert(
  result.simulatedSiteCount === 5,
  "Simulated count should be 5"
);

assert(
  approximatelyEqual(result.existingRate, 1),
  "Existing rate should be 1.00"
);

assert(
  approximatelyEqual(result.simulatedRate, 2.5),
  "Simulated rate should be 2.50"
);

assert(
  approximatelyEqual(result.rateChange, 1.5),
  "Rate change should be 1.50"
);

assert(
  approximatelyEqual(result.percentageChange, 150),
  "Percentage change should be 150%"
);

const zeroBaseline = calculateScenario({
  neighbourhoodCode: "ZERO",
  neighbourhoodName: "Zero Baseline",
  populationEstimate: 10000,
  existingSiteCount: 0,
  hypotheticalSiteCount: 2,
});

assert(
  zeroBaseline.percentageChange === null,
  "Percentage change must be undefined at zero baseline"
);

const zeroPopulation = calculateScenario({
  neighbourhoodCode: "NOPOP",
  neighbourhoodName: "Unknown Population",
  populationEstimate: 0,
  existingSiteCount: 1,
  hypotheticalSiteCount: 2,
});

assert(
  zeroPopulation.simulatedRate === null,
  "Rate must be undefined when population is zero"
);

console.log("All scenario planner tests passed.");
console.log(result);
