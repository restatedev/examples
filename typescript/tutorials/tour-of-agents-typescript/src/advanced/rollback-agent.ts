import * as restate from "@restatedev/restate-sdk";
import { generateText, stepCountIs, tool, wrapLanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { durableCalls, rethrowTerminalToolError } from "../middleware";
import {
  reserveHotel,
  reserveCar,
  reserveFlight,
  confirmHotel,
  confirmCar,
  confirmFlight,
  cancelCar,
  cancelFlight,
  cancelHotel,
  CarBooking,
  CarBookingSchema,
  FlightBooking,
  FlightBookingSchema,
  HotelBooking,
  HotelBookingSchema,
} from "../utils";

// <start_here>
const book = async (ctx: restate.Context, { prompt }: { prompt: string }) => {
  const on_rollback: { (): restate.RestatePromise<any> }[] = [];
  const on_success: { (): restate.RestatePromise<any> }[] = [];

  const model = wrapLanguageModel({
    model: openai("gpt-4o"),
    middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
  });

  try {
    const { text } = await generateText({
      model,
      system: `Book a complete travel package with the requirements in the prompt.
        Use the tools to request booking of hotel, flight, car.`,
      prompt,
      tools: {
        bookHotel: tool({
          description: "Book a hotel reservation",
          inputSchema: HotelBookingSchema,
          execute: async (req: HotelBooking) => {
            const result = await ctx.run("book-hotel", () => reserveHotel(req));
            on_success.push(() =>
              ctx.run("confirm-hotel", () => confirmHotel(result.id)),
            );
            on_rollback.push(() =>
              ctx.run("cancel-hotel", () => cancelHotel(result.id)),
            );
            return result;
          },
        }),
        bookFlight: tool({
          description: "Book a flight",
          inputSchema: FlightBookingSchema,
          execute: async (req: FlightBooking) => {
            const result = await ctx.run("book-flight", () =>
              reserveFlight(req),
            );
            on_success.push(() =>
              ctx.run("confirm-flight", () => confirmFlight(result.id)),
            );
            on_rollback.push(() =>
              ctx.run("cancel-flight", () => cancelFlight(result.id)),
            );
            return result;
          },
        }),
        bookCar: tool({
          description: "Book a car rental",
          inputSchema: CarBookingSchema,
          execute: async (req: CarBooking) => {
            const result = await ctx.run("book-car", () => reserveCar(req));
            on_success.push(() =>
              ctx.run("confirm-car", () => confirmCar(result.id)),
            );
            on_rollback.push(() =>
              ctx.run("cancel-car", () => cancelCar(result.id)),
            );
            return result;
          },
        }),
      },
      stopWhen: [stepCountIs(10)],
      onStepFinish: rethrowTerminalToolError,
      providerOptions: { openai: { parallelToolCalls: false } },
    });

    for (const confirm of on_success) {
      await confirm();
    }

    return text;
  } catch (error) {
    console.log("Error occurred, rolling back all bookings...");
    for (const rollback of on_rollback.reverse()) {
      await rollback();
    }
    throw error;
  }
};
// <end_here>

export default restate.service({
  name: "BookingWithRollbackAgent",
  handlers: { book },
});
