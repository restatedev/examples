export const flightClient = {
  book: async (customerId: string, _req: { flightId: string; passengerName: string }) => {
    console.info(`Flight booked for customer ${customerId}`);
  },
  cancel: async (customerId: string) => {
    console.info(`Flight cancelled for customer ${customerId}`);
  },
};
