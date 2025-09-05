import * as restate from "@restatedev/restate-sdk";
import { TerminalError } from "@restatedev/restate-sdk";
import { z } from "zod";
import * as crypto from "node:crypto";

// <start_weather>
export async function fetchWeather(city: string) {
  failOnDenver(city)
  const output = await fetchWeatherFromAPI(city);
  return parseWeatherResponse(output)
}
// <end_weather>

function failOnDenver(city: string) {
  if (city === "Denver") {
    const message = `[👻 SIMULATED] "Fetching weather failed: Weather API down..."`;
    console.error(message);
    throw new Error(message);
  }
}

async function fetchWeatherFromAPI(city: string) {
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
  const res = await fetch(url);
  const output = await res.text();
  if (!res.ok) {
    if (res.status === 404 && output) {
      throw new TerminalError(
          `Unknown location: ${city}. Please provide a valid city name.`,
      );
    }
    throw new Error(`Weather API returned status ${res.status}`);
  }
  return output;
}

async function parseWeatherResponse(output: string) {
  try {
    const data = JSON.parse(output);
    const current = data.current_condition?.[0];

    if (!current) {
      throw new Error("Missing current weather data");
    }

    return {
      temperature: current.temp_C,
      description: current.weatherDesc?.[0]?.value,
    };
  } catch (e) {
    throw new TerminalError("Could not parse weather API response", {
      cause: e,
    });
  }
}

export function emailCustomer(message: string, responseId: string = "") {
  console.log("Emailing customer:", message);
}

export function addClaimToLegacySystem(claimId: string, claim: InsuranceClaim) {
  // Simulate adding the claim to a legacy system
  console.log("Adding claim to legacy system:", claim);
  return crypto.randomUUID().toString();
}

export function doEligibilityCheck(claim: InsuranceClaim) {
  return undefined;
}

export function compareToStandardRates(claim: InsuranceClaim) {
  return undefined;
}

export function doFraudCheck(claim: InsuranceClaim) {
  return undefined;
}

async function runEligibilityAgent(
  ctx: restate.Context,
  claim: InsuranceClaim,
) {
  return undefined;
}

async function runRateComparisonAgent(
  ctx: restate.Context,
  claim: InsuranceClaim,
) {
  return undefined;
}

async function runFraudAgent(ctx: restate.Context, claim: InsuranceClaim) {
  return undefined;
}

export const eligibilityAgent = restate.service({
  name: "EligibilityAgent",
  handlers: {
    run: runEligibilityAgent,
  },
});

export const rateComparisonAgent = restate.service({
  name: "RateComparisonAgent",
  handlers: {
    run: runRateComparisonAgent,
  },
});

export const fraudCheckAgent = restate.service({
  name: "FraudCheckAgent",
  handlers: {
    run: runFraudAgent,
  },
});

export const InsuranceClaimSchema = z.object({
  category: z.string().nullable(),
  reason: z.string().nullable(),
  amount: z.number().nullable(),
});

export type InsuranceClaim = z.infer<typeof InsuranceClaimSchema>;