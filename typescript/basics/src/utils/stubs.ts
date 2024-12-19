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
  paymentRef: string,
): string {
  maybeCrash(0.3);
  console.log(`>>> Creating subscription ${subscription} for user ${userId} with payment ${paymentRef}`);
  return "SUCCESS";
}

/**
 * Simulates calling a payment API, with a random probability of API downtime.
 */
export function createRecurringPayment(
  creditCard: string,
  paymentId: any,
): string {
  maybeCrash(0.3);
  console.log(`>>> Creating recurring payment ${paymentId}`);
  return "payment-reference";
}

// Stubs for 3_workflows.ts
export async function createUserEntry(entry: { name: string; email: string }) {
    console.log(`Creating user entry for ${entry.name}`);
}
export async function sendEmailWithLink(req: {
  userId: string,
  user: {name: string, email: string};
  secret: string;
}) {
    console.info(`Sending email to ${req.user.email} with secret ${req.secret}. \n 
    To simulate a user clicking the link, run the following command: \n 
    curl localhost:8080/usersignup/${req.userId}/click -H 'content-type: application/json' -d '{ "secret": "${req.secret}"}'`);
}
