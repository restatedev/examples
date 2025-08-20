import * as restate from "@restatedev/restate-sdk";
import {Context, RestatePromise} from "@restatedev/restate-sdk";
import {
    createRecurringPayment,
    createSubscription,
    SubscriptionRequest
} from "../utils";

export const parallelSubscriptionService = restate.service({
    name: "ParallelSubscriptionService",
    handlers: {
        add: async (ctx: Context, req: SubscriptionRequest) => {
            const paymentId = ctx.rand.uuidv4();
            const payRef = await ctx.run("pay", () =>
                createRecurringPayment(req.creditCard, paymentId)
            );

            // Start all subscriptions in parallel
            const subscriptionPromises = []
            for (const subscription of req.subscriptions) {
                subscriptionPromises.push(ctx.run(`add-${subscription}`, () =>
                    createSubscription(req.userId, subscription, payRef)
                ))
            }

            // Wait for all subscriptions to complete
            await RestatePromise.all(subscriptionPromises)

            return { success: true, paymentRef: payRef };
        },
    },
});