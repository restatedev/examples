import * as restate from "@restatedev/restate-sdk";
import { chargeBankAccount, SubscriptionSvc } from "./utils/stubs";

const SubscriptionService: SubscriptionSvc = { name: "SubscriptionService" };

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
const myService = restate.service({
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
      const result = await ctx.objectClient(SubscriptionService, "my-sub-123").create("my-request");

      // ---
      // 3. DURABLE MESSAGING: send (delayed) messages to other services without deploying a message broker
      // Restate persists the timers and triggers execution
      ctx.objectSendClient(SubscriptionService, "my-sub-123").create("my-request");

      // ---
      // 4. DURABLE PROMISES: tracked by Restate, can be moved between processes and survive failures
      // Awakeables: block the workflow until notified by another handler
      const { id, promise } = ctx.awakeable();
      // Wait on the promise
      // If the process crashes while waiting, Restate will recover the promise somewhere else
      await promise;
      // Another process can resolve the awakeable via its ID
      ctx.resolveAwakeable(id);

      // ---
      // 5. DURABLE TIMERS: sleep or wait for a timeout, tracked by Restate and recoverable
      // When this runs on FaaS, the handler suspends and the timer is tracked by Restate
      // Example of durable recoverable sleep
      // If the service crashes two seconds later, Restate will invoke it after another 3 seconds
      await ctx.sleep({ seconds: 5 });
      // Example of waiting on a promise (call/awakeable/...) or a timeout
      await promise.orTimeout({ seconds: 5 });
      // Example of scheduling a handler for later on
      ctx
        .objectSendClient(SubscriptionService, "my-sub-123")
        .cancel(restate.rpc.sendOpts({ delay: { days: 1 } }));

      // ---
      // 7. PERSIST RESULTS: avoid re-execution of actions on retries
      // Use this for non-deterministic actions or interaction with APIs, DBs, ...
      // For example, generate idempotency keys that are stable across retries
      // Then use these to call other APIs and let them deduplicate
      const paymentDeduplicationID = ctx.rand.uuidv4();
      await ctx.run(() =>
        chargeBankAccount(paymentDeduplicationID, { amount: 100, account: "1234-5678-9012-3456" }),
      );
    },
  },
});
