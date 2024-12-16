import * as restate from "@restatedev/restate-sdk";

export const flights = restate.service({
    name: "flights",
    handlers: {
      reserve: async (ctx: restate.Context, tripId: string) => {
        const flightBooking = ctx.rand.uuidv4();
        console.info(`Flight ${flightBooking} reserved for trip ${tripId}`);
        return flightBooking;
      },

      confirm: async (ctx: restate.Context, req: {tripId: string, flightBooking: string}) => {
        console.info(`Flight ${req.flightBooking} confirmed for trip ${req.tripId}`);
      },

      cancel: async (ctx: restate.Context, req: {tripId: string, flightBooking: string}) => {
        console.info(`Flight ${req.flightBooking} cancelled for trip ${req.tripId}`);
      },
    }
});

export type FlightsService = typeof flights;