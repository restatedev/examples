import * as restate from "@restatedev/restate-sdk";
import {
    sendEmail, StripeEvent,
} from "./utils/stubs";

const MAX_REMINDERS = 3;
const REMINDER_INTERVAL = 24 * 60 * 60 * 1000;

/*
* A service that manages recurring payments for subscriptions.
*
* Have a look at the onPaymentFailure handler to see how to schedule a task for later.
* The handler gets called by payment failure webhook events from the payment provider.
* It then starts a reminder loop to notify the user to update the payment method.
* After 3 reminders, the subscription is cancelled.
 */
const paymentTracker = restate.object({
    name: "PaymentTracker",
    handlers: {
        // Schedule recurrent tasks with delayed self calls
        remindPaymentFailed: async (ctx: restate.ObjectContext, event: StripeEvent) => {
            // Stop the loop if the payment was successful in the meantime
            // This value gets stored in state by the onPaymentSuccess handler and can be queried from outside
            if (await ctx.get<string>("status") === "PAID") {
                ctx.clear("reminders_count");
                return;
            }

            // Otherwise, sent up to 3 reminders (via delayed self calls) and then escalate to the support team
            const remindersSent = await ctx.get<number>("reminders_count") ?? 0;
            if (remindersSent >= MAX_REMINDERS) {
                // Escalate to support
                ctx.objectSendClient(PaymentTracker, ctx.key).escalate(event);
                ctx.set("status", "FAILED_ESCALATED");
                return;
            }

            await ctx.run(() =>
                sendEmail(`Payment failed. Re-execute the payment within ${3 - remindersSent} days.`)
            );
            ctx.set("reminders_count", remindersSent + 1);
            ctx.set("status", "FAILED");

            // Schedule the next reminder
            ctx.objectSendClient(PaymentTracker, ctx.key, {delay: REMINDER_INTERVAL}).remindPaymentFailed(event);
        },

        onPaymentSuccess: async (ctx: restate.ObjectContext, event: StripeEvent) => {
            // Mark the invoice as paid
            ctx.set("status", "PAID");
        },

        escalate: async (ctx: restate.ObjectContext, event: StripeEvent) => {
            /*
             * Request human intervention to resolve the issue.
             */
        }
    }
})

const PaymentTracker: typeof paymentTracker = {name: "PaymentTracker"};

restate
    .endpoint()
    .bind(paymentTracker)
    .listen(9080);

/*
Check the README to learn how to run Restate.
Then invoke this function and see in the log how it recovers.
Each action (e.g. "created recurring payment") is only logged once across all retries.
Retries did not re-execute the successful operations.

curl localhost:8080/SubscriptionService/add -H 'content-type: application/json' -d \
'{
    "userId": "Sam Beckett",
    "creditCard": "1234-5678-9012-3456",
    "subscriptions" : ["Netflix", "Disney+", "HBO Max"]
}'
*/