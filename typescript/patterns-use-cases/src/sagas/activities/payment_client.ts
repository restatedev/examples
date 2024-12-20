import {randomUUID} from "node:crypto";
import {TerminalError} from "@restatedev/restate-sdk";

export const paymentClient = {
  charge: async (request: { paymentInfo: { cardNumber: string, amount: number }, paymentId: string }) => {
    if (Math.random() < 0.5) {
      console.error("This payment should never be accepted! Aborting booking.");
      throw new TerminalError("This payment could not be accepted!");
    }
    if (Math.random() < 0.8) {
      console.error("A payment failure happened! Will retry...");
      throw new Error("A payment failure happened! Will retry...");
    }
    console.info(`Payment ${request.paymentId} processed`);
  },

  refund: async (req: { paymentId: string }) => {
    console.info(`Payment ${req.paymentId} refunded`);
  },
};

