import * as restate from "@restatedev/restate-sdk";
import {
    sendEmail, SubscriptionRequest,
} from "./utils/stubs";

const MAX_REMINDERS = 3;
const REMINDER_TIMEOUT = 24 * 60 * 60 * 1000;

/*
Restate provides building blocks for resilient applications:
- Durable RPC: call other services with retries and recovery
- Durable messaging: send (delayed) messages to other services without deploying a message broker
- Durable promises: tracked by Restate, can be moved between processes and survive failures
- Durable timers: sleep or wait for a timeout, tracked by Restate and recoverable
- Flexible control flow: regular code with loops/forks/..., no custom DSLs
 */
const failedPaymentEventsProcessor = restate.workflow({
    name: "FailedPaymentEventsProcessor",
    handlers: {
        // You can use handlers as a durable webhook processor
        // This handler processes payment failure events from the payment provider
        // We notify the user and give them a chance to update their payment method
        run: async (ctx: restate.WorkflowContext) => {

            // Send periodic reminders to the user to update the payment method
            for (let remindersSent = 0; remindersSent < MAX_REMINDERS; remindersSent++) {
                await ctx.run(() =>
                    sendEmail(`Payment failed: update payment method within ${3 - remindersSent} days, or loose your subscriptions.`)
                );

                // Durable promises and timers: Wait for the payment or for a durable timeout
                try {
                    await ctx.promise("paymentFixed").get().orTimeout(REMINDER_TIMEOUT);
                    console.info("Payment fixed; stopping reminders.");
                    return;
                } catch (e) {
                    console.info("Payment not fixed; sending another reminder.");
                }
            }

            // Durable RPC: cancel all subscriptions when the payment did not get fixed
            await ctx.objectClient(SubscriptionService, ctx.key).cancelAll()
        },

        // Gets called by payment provider when the payment method was updated
        onPaymentMethodFixed: async (ctx: restate.WorkflowSharedContext) => {
            // Payment fixed; Stop notifying the user of the payment failure
            await ctx.promise("paymentFixed").resolve();
        }
    }
})
/*
Check the README to learn how to run Restate.

curl -X POST localhost:8080/FailedPaymentEventsProcessor/pay-id-123/run
curl -X POST localhost:8080/FailedPaymentEventsProcessor/pay-id-123/onPaymentMethodFixed
*/


// Stubs for the SubscriptionService
const subscriptionService = restate.object({
    name: "SubscriptionService",
    handlers: {
        create: async (ctx: restate.ObjectContext, req: SubscriptionRequest) => {},
        cancelAll: async (ctx: restate.ObjectContext) => {
            console.info(`Cancelling all subscriptions for user ${ctx.key}`);
        }
    }
})

const SubscriptionService: typeof subscriptionService = {name: "SubscriptionService"};

restate
    .endpoint()
    .bind(subscriptionService)
    .bind(failedPaymentEventsProcessor)
    .listen(9080);

