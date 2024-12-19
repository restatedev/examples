import * as restate from "@restatedev/restate-sdk";

export const cars = restate.service({
    name: "cars",
    handlers: {
        reserve: async (ctx: restate.Context, _req: { pickupLocation: string, rentalDate: string }) => {
            const carBookingId = ctx.rand.uuidv4();
            console.info(`Car ${carBookingId} reserved`);
            return carBookingId;
        },

        confirm: async (ctx: restate.Context, req: {carBookingId: string}) => {
            console.info(`Car ${req.carBookingId} confirmed`);
        },

        cancel: async (ctx: restate.Context, req: {carBookingId: string}) => {
            console.info(`Car ${req.carBookingId} cancelled`);
        },
    }
});

export type CarService = typeof cars;
