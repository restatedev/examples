import * as restate from "@restatedev/restate-sdk";
import { TerminalError } from "@restatedev/restate-sdk";
import { randomUUID } from "node:crypto";

// TYPES

export type SubscriptionRequest = {
  userId: string;
  creditCard: string;
  subscriptions: string[];
};

export type PurchaseTicketRequest = {
  ticketId: string;
  price: number;
  customerEmail: string;
  concertDateTime: string;
  millisUntilConcert: number;
};

export type PaymentRequest = {
  amount: number;
  currency: string;
  customerId: string;
  orderId: string;
};

export type PaymentResult = {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
};

// HELPERS

function failOnNetflix(subscription: string) {
  if (subscription === "Netflix") {
    const message = `[👻 SIMULATED] "Netflix subscription failed: Netflix API down..."`;
    console.error(message);
    throw new Error(message);
  }
}

function terminalErrorOnDisney(subscription: string) {
  if (subscription === "Disney") {
    const message = `[👻 SIMULATED] "Disney subscription is not available in this region"`;
    console.error(message);
    throw new TerminalError(message);
  }
}

export function createSubscription(
  userId: string,
  subscription: string,
  _paymentRef: string,
): string {
  failOnNetflix(subscription);
  terminalErrorOnDisney(subscription);
  console.log(`>>> Created subscription ${subscription} for user ${userId}`);
  return "SUCCESS";
}

export function removeSubscription(userId: string, subscription: string) {
  console.log(`>>> Removed subscription ${subscription} for user ${userId}`);
}

export function createRecurringPayment(
  _creditCard: string,
  paymentId: any,
): string {
  console.log(`>>> Creating recurring payment ${paymentId}`);
  return "payment-" + randomUUID().toString();
}

export function removeRecurringPayment(paymentId: any) {
  console.log(`>>> Removing recurring payment ${paymentId}`);
}

export function initiateExternalPayment(
  req: PaymentRequest,
  paymentId: string,
) {
  console.log(`>>> Initiating external payment ${paymentId}`);
  return "payRef-" + randomUUID().toString();
}

export function cancelExternalPayment(payRef: string) {
  console.log(`>>> Canceling external payment with ref ${payRef}`);
}

// SERVICES

export const paymentService = restate.service({
  name: "PaymentService",
  handlers: {
    processPayment: async (
      ctx: restate.Context,
      req: PurchaseTicketRequest,
    ): Promise<string> => {
      // Simulate payment processing
      const paymentId = ctx.rand.uuidv4();
      console.log(
        `Processing payment for ticket ${req.ticketId} with payment ID ${paymentId}`,
      );
      return paymentId;
    },
  },
});

export const notificationService = restate.service({
  name: "NotificationService",
  handlers: {
    emailTicket: async (
      ctx: restate.Context,
      req: PurchaseTicketRequest,
    ): Promise<void> => {
      console.log(
        `Sending ticket to ${req.customerEmail} for concert on ${req.concertDateTime}`,
      );
    },
    sendReminder: async (
      ctx: restate.Context,
      req: PurchaseTicketRequest,
    ): Promise<void> => {
      console.log(
        `Sending reminder for concert on ${req.concertDateTime} to ${req.customerEmail}`,
      );
    },
  },
});
