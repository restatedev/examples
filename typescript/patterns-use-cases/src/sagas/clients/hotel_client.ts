import { TerminalError } from "@restatedev/restate-sdk";

export const hotelClient = {
  book: async (
    customerId: string,
    _req: { arrivalDate: string; departureDate: string }
  ) => {
    console.error("[👻 SIMULATED] This hotel is fully booked!");
    throw new TerminalError("[👻 SIMULATED] This hotel is fully booked!");
  },
  cancel: async (customerId: string) => {
    console.info(`Hotel cancelled for customer ${customerId}`);
  },
};
