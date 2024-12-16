import * as restate from "@restatedev/restate-sdk";

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
  maybeCrash(0.3);
  console.log(`>>> Creating subscription ${subscription} for user ${userId}`);

  if (Math.random() < 0.5) {
    console.error("Duplicate subscription.");
    throw new restate.TerminalError("Duplicate subscription");
  }

  return "SUCCESS";
}

/**
 * Simulates calling a payment API, with a random probability of API downtime.
 */
export function createRecurringPayment(
  creditCard: string,
  paymentId: any,
): { success: boolean } {
  maybeCrash(0.3);
  console.log(`>>> Creating recurring payment ${paymentId} for user ${userId}`);
  return { success: true };
}

// Stubs for 3_workflows.ts
export async function createUserEntry(entry: { name: string; email: string }) {}
export async function sendEmailWithLink(details: {
  email: string;
  secret: string;
}) {}
