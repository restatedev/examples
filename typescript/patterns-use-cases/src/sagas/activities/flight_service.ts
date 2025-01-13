import * as restate from "@restatedev/restate-sdk";

export const flightsService = restate.service({
    name: "FlightsService",
    handlers: {
      reserve: async (ctx: restate.Context, _req: { flightId: string, passengerName: string }) => {
        const flightBookingId = ctx.rand.uuidv4();
        console.info(`Flight ${flightBookingId} reserved`);
        return flightBookingId;
      },

      confirm: async (ctx: restate.Context, req: {flightBookingId: string}) => {
        console.info(`Flight ${req.flightBookingId} confirmed`);
      },

      cancel: async (ctx: restate.Context, req: {flightBookingId: string}) => {
        console.info(`Flight ${req.flightBookingId} cancelled`);
      },
    }
});

export type FlightsService = typeof flightsService;