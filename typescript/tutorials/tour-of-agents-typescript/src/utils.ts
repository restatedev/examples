import * as restate from "@restatedev/restate-sdk";
import { TerminalError } from "@restatedev/restate-sdk";
import { z } from "zod";
import * as crypto from "node:crypto";
import { generateText, wrapLanguageModel } from "ai";
import { durableCalls } from "./middleware";
import { openai } from "@ai-sdk/openai";

// <start_weather>
export async function fetchWeather(city: string) {
  failOnDenver(city);
  const output = await fetchWeatherFromAPI(city);
  return parseWeatherResponse(output);
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

export function requestHumanReview(message: string, responseId: string = "") {
  console.log(`>>> ${message} \n
  Submit your claim review via: \n
    curl localhost:8080/restate/awakeables/${responseId}/resolve --json 'true'
  `);
}

export function emailCustomer(message: string, responseId: string = "") {
  console.log("Emailing customer:", message);
}

export function submitClaim(claim: InsuranceClaim) {
  // Simulate adding the claim to a legacy system
  console.log("Adding claim to legacy system:", claim);
  return crypto.randomUUID().toString();
}

export function getMissingFields(claim: InsuranceClaim) {
  return Object.entries(claim)
    .filter(
      ([_, value]) =>
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0),
    )
    .map(([key, _]) => key);
}

export function checkEligibility(claim: InsuranceClaim) {
  return "eligible";
}

export function compareToStandardRates(claim: InsuranceClaim) {
  return "reasonable";
}

export function checkFraud(claim: InsuranceClaim) {
  return "low risk";
}

export const eligibilityAgent = restate.service({
  name: "EligibilityAgent",
  handlers: {
    run: async (ctx: restate.Context, claim: InsuranceClaim) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });
      const { text } = await generateText({
        model,
        system:
          "Decide whether the following claim is eligible for reimbursement." +
          "Respond with eligible if it's a medical claim, and not eligible otherwise.",
        prompt: JSON.stringify(claim),
      });
      return text;
    },
  },
});

export const rateComparisonAgent = restate.service({
  name: "RateComparisonAgent",
  handlers: {
    run: async (ctx: restate.Context, claim: InsuranceClaim) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });
      const { text } = await generateText({
        model,
        system:
          "Decide whether the cost of the claim is reasonable given the treatment." +
          "Respond with reasonable or not reasonable.",
        prompt: JSON.stringify(claim),
      });
      return text;
    },
  },
});

export const fraudCheckAgent = restate.service({
  name: "FraudCheckAgent",
  handlers: {
    run: async (ctx: restate.Context, claim: InsuranceClaim) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });
      const { text } = await generateText({
        model,
        system:
          "Decide whether the claim is fraudulent." +
          "Always respond with low risk, medium risk, or high risk.",
        prompt: JSON.stringify(claim),
      });
      return text;
    },
  },
});

export const InsuranceClaimSchema = z.object({
  date: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  placeOfService: z.string().nullable().optional(),
});

export type InsuranceClaim = z.infer<typeof InsuranceClaimSchema>;

export const HotelBookingSchema = z.object({
  name: z.string(),
  dates: z.string(),
  guests: z.number(),
});

export type HotelBooking = z.infer<typeof HotelBookingSchema>;

export const FlightBookingSchema = z.object({
  from: z.string(),
  to: z.string(),
  date: z.string(),
  passengers: z.number(),
});
export type FlightBooking = z.infer<typeof FlightBookingSchema>;

export const CarBookingSchema = z.object({
  location: z.string(),
  dates: z.string(),
  type: z.string(),
});

export type CarBooking = z.infer<typeof CarBookingSchema>;

export async function reserveHotel({ name, guests, dates }: HotelBooking) {
  const id = crypto.randomUUID().toString();
  console.log(`Created hotel booking ${id}`);
  return {
    id,
    confirmation: `Hotel ${name} booked for ${guests} guests on ${dates}`,
  };
}

export async function reserveFlight({
  from,
  to,
  date,
  passengers,
}: FlightBooking) {
  const id = crypto.randomUUID().toString();
  console.log(`Created flight booking ${id}`);
  return {
    id,
    confirmation: `Flight from ${from} to ${to} on ${date} for ${passengers} passengers`,
  };
}

export async function reserveCar({ type, location, dates }: CarBooking) {
  if (type === "SUV") {
    const message = `[👻 SIMULATED] "Car booking failed: No SUVs available..."`;
    console.error(message);
    throw new restate.TerminalError(message);
  }

  const id = crypto.randomUUID().toString();
  console.log(`Created car booking ${id}`);
  return {
    id,
    confirmation: `${type} car rental in ${location} for ${dates}`,
  };
}

export async function confirmHotel(id: string) {
  console.log(`Confirmed hotel booking ${id}`);
}

export async function confirmFlight(id: string) {
  console.log(`Confirmed flight booking ${id}`);
}

export async function confirmCar(id: string) {
  console.log(`Confirmed car booking ${id}`);
}

export async function cancelHotel(id: string) {
  console.log(`Cancelled hotel booking ${id}`);
}

export async function cancelFlight(id: string) {
  console.log(`Cancelled flight booking ${id}`);
}

export async function cancelCar(id: string) {
  console.log(`Cancelled car booking ${id}`);
}
