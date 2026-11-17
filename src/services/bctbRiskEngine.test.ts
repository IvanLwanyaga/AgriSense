/// <reference types="vitest/globals" />

import { assessBctbRisk, determineRiskLevel, MANDATORY_DISCLAIMER } from "./bctbRiskEngine";
import { DEFAULT_RULE_CONFIG } from "./bctbRuleConfig";
import type { BctbAssessmentInput, WeatherMetrics } from "../types/bctb";

export interface TestResultReport {
  scenarioNumber: number;
  scenarioName: string;
  passed: boolean;
  score: number;
  riskLevel: string;
  dataQuality: string;
  weatherAvailable: boolean;
  notes: string;
}

export function runAllRiskEngineAcceptanceTests(): {
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
  results: TestResultReport[];
} {
  const results: TestResultReport[] = [];

  const sampleWeather: WeatherMetrics = {
    cumulativeRainfall7dMm: 12.5,
    cumulativeRainfall14dMm: 24.0,
    cumulativeRainfall30dMm: 68.0,
    tempAvg7dC: 23.4,
    tempAvg30dC: 22.8,
    consecutiveDrySpellDays: 4,
    provider: "Open-Meteo",
    retrievedAt: new Date().toISOString(),
    granularity: "EXACT_COORDINATES",
  };

  const droughtWeather: WeatherMetrics = {
    cumulativeRainfall7dMm: 0,
    cumulativeRainfall14dMm: 0,
    cumulativeRainfall30dMm: 14.2,
    tempAvg7dC: 28.5,
    tempAvg30dC: 27.2,
    consecutiveDrySpellDays: 18,
    provider: "Open-Meteo",
    retrievedAt: new Date().toISOString(),
    granularity: "EXACT_COORDINATES",
  };

  // Test 1: Low-risk scenario
  {
    const input: BctbAssessmentInput = {
      pinSizedHoles: false,
      blackening: false,
      wilting: false,
      drying: false,
      yellowing: false,
      increasingTwigDamage: false,
      previousBctbHistory: false,
      affectedTwigCount: 0,
      recentPruning: true,
      recentDeSuckering: true,
      affectedTwigRemoval: "CONSISTENT",
      farmSanitation: "GOOD",
      shadeCanopy: "MODERATE",
      locationConsent: true,
      followUpConsent: false,
    };
    const res = assessBctbRisk(input, sampleWeather);
    const passed = res.riskLevel === "LOW" && res.internalScore < 30 && res.dataQuality === "GOOD";
    results.push({
      scenarioNumber: 1,
      scenarioName: "1. Low-risk scenario",
      passed,
      score: res.internalScore,
      riskLevel: res.riskLevel,
      dataQuality: res.dataQuality,
      weatherAvailable: res.weatherAvailable,
      notes: passed ? "Correctly classified as LOW risk (Score: " + res.internalScore + ")" : "Expected LOW risk",
    });
  }

  // Test 2: Moderate-risk scenario
  {
    const input: Partial<BctbAssessmentInput> = {
      pinSizedHoles: false,
      wilting: true, // +15
      drying: true,
      yellowing: true, // +10
      affectedTwigRemoval: "INCONSISTENT", // +6
      farmSanitation: "FAIR",
      previousBctbHistory: false,
      increasingTwigDamage: false,
      blackening: false,
    };
    const res = assessBctbRisk(input, sampleWeather); // Total ~31 -> MODERATE
    const passed = res.riskLevel === "MODERATE" && res.internalScore >= 30 && res.internalScore <= 59;
    results.push({
      scenarioNumber: 2,
      scenarioName: "2. Moderate-risk scenario",
      passed,
      score: res.internalScore,
      riskLevel: res.riskLevel,
      dataQuality: res.dataQuality,
      weatherAvailable: res.weatherAvailable,
      notes: passed ? "Correctly classified as MODERATE risk (Score: " + res.internalScore + ")" : "Expected MODERATE risk",
    });
  }

  // Test 3: High-risk scenario
  {
    const input: Partial<BctbAssessmentInput> = {
      pinSizedHoles: true, // +30
      increasingTwigDamage: true, // +20
      blackening: true, // +15
      wilting: true, // +15
      previousBctbHistory: true, // +15
      affectedTwigCount: 15, // +20
      affectedTwigRemoval: "NONE", // +10
      farmSanitation: "POOR", // +10
    };
    const res = assessBctbRisk(input, droughtWeather);
    const passed = res.riskLevel === "HIGH" && res.internalScore >= 60 && res.advisoryCategory === "REQUEST_VERIFICATION";
    results.push({
      scenarioNumber: 3,
      scenarioName: "3. High-risk scenario",
      passed,
      score: res.internalScore,
      riskLevel: res.riskLevel,
      dataQuality: res.dataQuality,
      weatherAvailable: res.weatherAvailable,
      notes: passed ? "Correctly identified as HIGH risk (Score: " + res.internalScore + ") with verification request" : "Expected HIGH risk",
    });
  }

  // Test 4: Missing-weather scenario
  {
    const input: Partial<BctbAssessmentInput> = {
      pinSizedHoles: true,
      blackening: false,
      wilting: false,
      drying: false,
      yellowing: false,
      increasingTwigDamage: false,
      previousBctbHistory: false,
      affectedTwigRemoval: "CONSISTENT",
      farmSanitation: "GOOD",
    };
    const res = assessBctbRisk(input, null);
    const passed = !res.weatherAvailable && res.weatherSnapshot === null && typeof res.internalScore === "number";
    results.push({
      scenarioNumber: 4,
      scenarioName: "4. Missing-weather scenario",
      passed,
      score: res.internalScore,
      riskLevel: res.riskLevel,
      dataQuality: res.dataQuality,
      weatherAvailable: res.weatherAvailable,
      notes: passed ? "Executed safely with weatherAvailable=false without crashing" : "Failed missing weather test",
    });
  }

  // Test 5: Partial-data scenario
  {
    const input: Partial<BctbAssessmentInput> = {
      pinSizedHoles: true,
      blackening: false,
      wilting: null,
      drying: null,
      yellowing: true,
      increasingTwigDamage: null,
      previousBctbHistory: null,
      affectedTwigRemoval: null,
      farmSanitation: null,
    };
    const res = assessBctbRisk(input, null);
    const passed = res.dataQuality === "INSUFFICIENT" || res.dataQuality === "LIMITED";
    results.push({
      scenarioNumber: 5,
      scenarioName: "5. Partial-data scenario",
      passed,
      score: res.internalScore,
      riskLevel: res.riskLevel,
      dataQuality: res.dataQuality,
      weatherAvailable: res.weatherAvailable,
      notes: passed ? "Identified data quality as " + res.dataQuality : "Failed partial data quality check",
    });
  }

  // Test 6: Unknown farmer-response scenario
  {
    const input: Partial<BctbAssessmentInput> = {
      pinSizedHoles: null,
      blackening: null,
      wilting: null,
      drying: null,
      yellowing: null,
      increasingTwigDamage: null,
      previousBctbHistory: null,
      affectedTwigCount: null,
      affectedTwigRemoval: null,
      farmSanitation: null,
    };
    const res = assessBctbRisk(input, null);
    const passed = !isNaN(res.internalScore) && res.riskLevel === "LOW" && res.dataQuality === "INSUFFICIENT";
    results.push({
      scenarioNumber: 6,
      scenarioName: "6. Unknown farmer-response scenario",
      passed,
      score: res.internalScore,
      riskLevel: res.riskLevel,
      dataQuality: res.dataQuality,
      weatherAvailable: res.weatherAvailable,
      notes: passed ? "Gracefully handled all null inputs; score=0, dataQuality=INSUFFICIENT" : "Failed unknown response test",
    });
  }

  // Test 7: Multiple triggered-rule scenario
  {
    const input: Partial<BctbAssessmentInput> = {
      pinSizedHoles: true,
      increasingTwigDamage: true,
      blackening: true,
      wilting: true,
      previousBctbHistory: true,
      affectedTwigRemoval: "NONE",
      farmSanitation: "POOR",
      shadeCanopy: "DENSE",
    };
    const res = assessBctbRisk(input, droughtWeather);
    const passed = res.internalScore === 100 && res.triggeredFactors.length <= 5 && res.shapContributions.length > 5;
    results.push({
      scenarioNumber: 7,
      scenarioName: "7. Multiple triggered-rule scenario",
      passed,
      score: res.internalScore,
      riskLevel: res.riskLevel,
      dataQuality: res.dataQuality,
      weatherAvailable: res.weatherAvailable,
      notes: passed ? "Capped cleanly at 100 with top 5 factors selected" : "Failed multiple triggered-rules test",
    });
  }

  // Test 8: No-triggered-rule scenario
  {
    const input: Partial<BctbAssessmentInput> = {
      pinSizedHoles: false,
      blackening: false,
      wilting: false,
      drying: false,
      yellowing: false,
      increasingTwigDamage: false,
      previousBctbHistory: false,
      affectedTwigCount: 0,
      affectedTwigRemoval: "CONSISTENT",
      farmSanitation: "GOOD",
      shadeCanopy: "MODERATE",
    };
    const res = assessBctbRisk(input, sampleWeather);
    const passed = res.internalScore === 0 && res.riskLevel === "LOW" && res.triggeredFactors.length === 0;
    results.push({
      scenarioNumber: 8,
      scenarioName: "8. No-triggered-rule scenario",
      passed,
      score: res.internalScore,
      riskLevel: res.riskLevel,
      dataQuality: res.dataQuality,
      weatherAvailable: res.weatherAvailable,
      notes: passed ? "Score=0, LOW risk, no triggered risk factors" : "Failed no-triggered-rules test",
    });
  }

  // Test 9: Invalid input scenario
  {
    const malformedInput = {
      affectedTwigCount: -99,
      pinSizedHoles: "yes" as unknown as boolean,
      farmSanitation: 12345 as unknown as "GOOD",
    };
    const res = assessBctbRisk(malformedInput, null);
    const passed = !isNaN(res.internalScore) && res.riskLevel === "LOW" && res.disclaimer === MANDATORY_DISCLAIMER;
    results.push({
      scenarioNumber: 9,
      scenarioName: "9. Invalid input scenario",
      passed,
      score: res.internalScore,
      riskLevel: res.riskLevel,
      dataQuality: res.dataQuality,
      weatherAvailable: res.weatherAvailable,
      notes: passed ? "Sanitized malformed/negative inputs without throwing runtime exception" : "Failed invalid input test",
    });
  }

  // Test 10: Boundary-value scenarios
  {
    const thresholds = DEFAULT_RULE_CONFIG.thresholds; // lowMax: 29, moderateMax: 59
    const level29 = determineRiskLevel(29, thresholds);
    const level30 = determineRiskLevel(30, thresholds);
    const level59 = determineRiskLevel(59, thresholds);
    const level60 = determineRiskLevel(60, thresholds);

    const passed =
      level29 === "LOW" &&
      level30 === "MODERATE" &&
      level59 === "MODERATE" &&
      level60 === "HIGH";

    results.push({
      scenarioNumber: 10,
      scenarioName: "10. Boundary-value scenarios",
      passed,
      score: 60,
      riskLevel: "HIGH",
      dataQuality: "GOOD",
      weatherAvailable: true,
      notes: passed
        ? `Boundaries verified: 29->${level29}, 30->${level30}, 59->${level59}, 60->${level60}`
        : "Boundary values failed threshold tests",
    });
  }

  const passedTests = results.filter((r) => r.passed).length;
  return {
    allPassed: passedTests === results.length,
    totalTests: results.length,
    passedTests,
    results,
  };
}

if (typeof describe === "function" && typeof it === "function") {
  describe("BCTB Risk Engine Acceptance Tests", () => {
    it("passes all 10 agronomic rule scenarios and boundary tests", () => {
      const report = runAllRiskEngineAcceptanceTests();
      if (!report.allPassed) {
        const failures = report.results.filter((r) => !r.passed);
        console.error("Failed scenarios:", failures);
      }
      expect(report.allPassed).toBe(true);
      expect(report.passedTests).toBe(10);
    });
  });
}
