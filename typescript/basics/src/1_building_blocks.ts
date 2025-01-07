import * as restate from "@restatedev/restate-sdk";
import {
    SubscriptionRequest,
} from "./utils/stubs";

/*
* RESTATE's DURABLE BUILDING BLOCKS
*
* Restate turns familiar programming constructs into recoverable, distributed building blocks.
* They get persisted in Restate, survive failures, and can be revived on another process.
*
* No more need for retry/recovery logic, K/V stores, workflow orchestrators,
* scheduler services, message queues, ...
*
* The run handler below shows a catalog of these building blocks.
* Look at the other examples in this project to see how to use them in examples.
 */
const myObject = restate.service({
    name: "myService",
    handlers: {
        // This handler can be called over HTTP at http://restate:8080/myService/handlerName
        // Use the context to access Restate's durable building blocks
        run: async (ctx: restate.Context) => {

            // ---
            // 1. IDEMPOTENCY: Add an idempotency key to the header of your requests
            // Restate deduplicates calls automatically. Nothing to do here.

            // ---
            // 2. DURABLE RPC: Call other services without manual retry and deduplication logic
            // Restate persists all requests and ensures execution till completion
            const details = await ctx.objectClient(SubscriptionService, "my-sub-123").getDetails();

            // ---
            // 3. DURABLE MESSAGING: send (delayed) messages to other services without deploying a message broker
            // Restate persists the timers and triggers execution
            ctx.objectSendClient(SubscriptionService, "my-sub-123", {delay: 24*60*60*1000}).cancel();

            // ---
            // 4. DURABLE PROMISES: tracked by Restate, can be moved between processes and survive failures
            // Awakeables: block the workflow until notified by another handler
            const {id, promise} = ctx.awakeable()
            // Use the Id from some other process to resolve it later
            ctx.resolveAwakeable(id);
            // Meanwhile, the workflow is blocked
            // These kind of blocking operations
            await promise;

            // ---
            // 5. DURABLE TIMERS: sleep or wait for a timeout, tracked by Restate and recoverable
            // When this runs on FaaS, the handler suspends and the timer is tracked by Restate
            // Example of durable recoverable sleep
            ctx.sleep(5000)
            // Example of waiting on durable promise or a timeout
            await promise.orTimeout(5000);
            // Example of scheduling a handler for later on
            ctx.objectSendClient(SubscriptionService, "my-sub-123", {delay: 24*60*60*1000}).cancel();

            // ---
            // 7. PERSIST RESULTS: avoid re-execution of actions on retries
            // Use this for non-deterministic actions or interaction with APIs, DBs, ...
            // For example, generate idempotency keys that are stable across retries
            // Then use these to call other APIs and let them deduplicate
            const paymentDeduplicationID = ctx.rand.uuidv4();
            await ctx.run(() =>
                chargeBankAccount(paymentDeduplicationID, {amount: 100, account: "1234-5678-9012-3456"}));
        },
    }
})

// ----------------------------------------------------------
// Stubs; ignore these

function chargeBankAccount(paymentDeduplicationID: string, param2: { amount: number; account: string }) {
    return undefined;
}

const subscriptionService = restate.object({
    name: "SubscriptionService",
    handlers: {
        create: async (ctx: restate.ObjectContext, req: SubscriptionRequest) => {},
        cancel: async (ctx: restate.ObjectContext) => {
            console.info(`Cancelling all subscriptions for user ${ctx.key}`);
        },
        getDetails: async (ctx: restate.ObjectContext) => {
            return {email: ctx.key + "@example.com"};
        }
    }
})

const SubscriptionService: typeof subscriptionService = {name: "SubscriptionService"};
