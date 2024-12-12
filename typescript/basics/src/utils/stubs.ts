/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

/**
 * Utility to let the service crash with a probability to show how the system recovers.
 */
const killProcess: boolean = Boolean(process.env.CRASH_PROCESS);
export function maybeCrash(probability: number = 0.5): void {
  if (Math.random() < probability) {
    console.error("A failure happened!");

    if (killProcess) {
      console.error("--- CRASHING THE PROCESS ---");
      process.exit(1);
    } else {
      throw new Error("A failure happened!");
    }
  }
}

export type SubscriptionRequest = {
  userId: string;
  creditCard: string;
  subscriptions: string[];
};

/**
 * Simulates calling a subscription API, with a random probability of API downtime.
 */
export function createSubscription(
  userId: string,
  subscription: string,
): string {
  console.log(`>>> Creating subscription ${subscription} for user ${userId}`);
  maybeCrash(0.3);

  if (Math.random() < 0.3) {
    return "ALREADY_EXISTS";
  }

  return "SUCCESS";
}

/**
 * Simulates calling a payment API, with a random probability of API downtime.
 */
export function createRecurringPayment(
  userId: string,
  creditCard: string,
  paymentId: any,
): { success: boolean } {
  maybeCrash(0.3);
  console.log(`>>> Creating recurring payment ${paymentId} for user ${userId}`);
  return { success: true };
}

export function removeRecurringPayment(paymentId: any) {
  console.log(`>>> Removing recurring payment ${paymentId}`);
}

export function removeSubscription(userId: string, subscription: string) {
  console.log(`>>> Removing subscription ${subscription} for user ${userId}`);
}

// Stubs for 3_workflows.ts
export async function createUserEntry(entry: { name: string; email: string }) {}
export async function sendEmailWithLink(details: {
  email: string;
  secret: string;
}) {}
