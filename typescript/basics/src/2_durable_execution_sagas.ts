import * as restate from "@restatedev/restate-sdk";
import { service } from "@restatedev/restate-sdk";
import {
  SubscriptionRequest,
  createRecurringPayment,
  createSubscription,
  removeRecurringPayment,
  removeSubscription,
} from "./utils/stubs";

// Restate ensures code runs to completion despite failures:
// - Failures are retried infinitely by default.
// - Mark failures that should not be retried as TerminalError.
// - On a Terminal Error, you need to undo the work done so far (a.k.a. sagas), to leave the system in a consistent state.
// - Implement sagas by registering undo actions and running them in case of a terminal error.
// - Restate ensures that all undo actions run.
restate
  .endpoint()
  .bind(
    service({
      name: "SubscriptionService",
      // Restate persists HTTP requests to this handler and manages execution.
      handlers: {
        add: async (ctx: restate.Context, req: SubscriptionRequest) => {
          const { userId, creditCard, subscriptions } = req;

          // We will add the undo actions to this list
          const compensations = [];
          try {
            const paymentId = ctx.rand.uuidv4();
            // Register compensating actions for steps that need to be undone in case of a terminal error
            compensations.push(() => removeRecurringPayment(paymentId));
            const { success } = await ctx.run(() =>
              createRecurringPayment(userId, creditCard, paymentId),
            );
            if (!success) {
              return;
            }

            for (const subscription of subscriptions) {
              // Register compensating actions for the subscriptions, to run in case of a terminal error
              compensations.push(() =>
                removeSubscription(userId, subscription),
              );
              const result = await ctx.run(() =>
                createSubscription(userId, subscription),
              );
              // If the subscription already exists, then revert the payment and other subscriptions
              // and surface the error to the user
              if (result == "ALREADY_EXISTS") {
                throw new restate.TerminalError("Duplicate subscription");
              }
            }
          } catch (err) {
            // On TerminalError, Restate runs compensations without retrying.
            // On other errors, Restate does not run compensations but retries from the last successful operation.
            if (err instanceof restate.TerminalError) {
              console.error(">>> Terminal error occurred. Running compensations.");
              for (const compensation of compensations.reverse()) {
                await ctx.run(compensation);
              }
            }
            throw err;
          }
        },
      },
    }),
  )
  .listen(9080);

/*
Check the README to learn how to run Restate.
Then invoke this function and see how compensations get triggered for a percentage of the requests.

curl localhost:8080/SubscriptionService/add -H 'content-type: application/json' \
    -d '{
            "userId": "Sam Beckett",
            "creditCard": "1234-5678-9012-3456",
            "subscriptions" : ["Netflix", "Disney+", "HBO Max"]
        }'
*/
