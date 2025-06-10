export const carRentalClient = {
  book: async (customerId: string, _req: { pickupLocation: string; rentalDate: string }) => {
    console.info(`Car booked for customer ${customerId}`);
  },
  cancel: async (customerId: string) => {
    console.info(`Car cancelled for customer ${customerId}`);
  },
};
