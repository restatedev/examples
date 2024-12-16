import * as restate from "@restatedev/restate-sdk";

export const cars = restate.service({
    name: "cars",
    handlers: {
        reserve: async (ctx: restate.Context, tripId: string) => {
            const carBooking = ctx.rand.uuidv4();
            console.info(`Car ${carBooking} reserved for trip ${tripId}`);
            return carBooking;
        },

        confirm: async (ctx: restate.Context, req: {tripId: string, carBooking: string}) => {
            console.info(`Car ${req.carBooking} confirmed for trip ${req.tripId}`);
        },

        cancel: async (ctx: restate.Context, req: {tripId: string, carBooking: string}) => {
            console.info(`Car ${req.carBooking} cancelled for trip ${req.tripId}`);
        },
    }
});

export type CarService = typeof cars;
