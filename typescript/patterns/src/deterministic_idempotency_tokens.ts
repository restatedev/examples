import * as restate from "@restatedev/restate-sdk";
import { randomUUID } from "crypto";

//  -----------------                                         -----------------
//                      Idempotency Tokens / Unique Tokens 
//  -----------------                                         -----------------
//
// Idempotency tokens are useful when trying to make external calls idempotent,
// so that retries do not result in applying a change multiple times.
//
// One of the most famous examples for that is the Stripe idempotency token,
// which one attaches to a payment API call to ensure the payment is made
// just once.
//
// Generating idempotency tokens reliably can be surprisingly tricky, especially
// when they should be stable under various forms of failures or network partition
// scenarios.
//
// Restate makes this dead simple, in various different ways: 
//

// ----------------------------------------------------------------------------
//                   ** option 1** use request parameter
// ----------------------------------------------------------------------------

// Restate persists the request parameter and ensures that all retries of the
// 'makeIdempotentCall1()' function get that persisted parameter.
// If a suitable token is in the request parameter, it is safe to use it

async function makeIdempotentCall1(ctx: restate.RpcContext, request: any) {

    await ctx.sideEffect(() => api.makeCall(request, request.idempotencyToken));
}

// ----------------------------------------------------------------------------
//                   ** option 2** stable deterministic random
// ----------------------------------------------------------------------------

// Restate offers deterministic Random number generators that are seeded with
// the durable invocation ID. This random number generator is guaranteed to
// always return the same value across all retries of the invocation,
// regardless of crashes/failover of either the service or the Restate runtime.

async function makeIdempotentCall2(ctx: restate.RpcContext, request: any) {

    const idempotencyToken = ctx.rand.uuidv4();
    await ctx.sideEffect(() => api.makeCall(request, idempotencyToken));
}

// ----------------------------------------------------------------------------
//                   ** option 3** Side effect UUID
// ----------------------------------------------------------------------------

// Side effects are guaranteed to agree on one specific return value before that
// value is passed to the application. The returned value will never change across
// retries of the invocation, regardless of crashes/failover of either the service
// or the Restate runtime.
// Note that this is more expensive than the 'ctx.rand.uuidv4()' variant, because
// it requires an additional consensus operation by the Restate runtime.

async function makeIdempotentCall3(ctx: restate.RpcContext, request: any) {

    const idempotencyToken = await ctx.sideEffect(async () => randomUUID())
    await ctx.sideEffect(() => api.makeCall(request, idempotencyToken));
}

// ----------------------------------------------------------------------------
//             ** option 4** Reserve token in external system
// ----------------------------------------------------------------------------

// In some cases, it might be required to make an actual call to another API
// to reserve a token first. This can also be achieved with a sideEffect.
//
// While there may be cases where multiple calls to the tokens reservation API
// happen (in case of failures in the small window between the call and the time
// when the sideEffect commits), one value will ultimately be committed by Restate
// as the sideEffect's result and that same value will be seen by all executions
// and retries of that function invocation.

async function makeIdempotentCall4(ctx: restate.RpcContext, request: any) {

    const idempotencyToken = await ctx.sideEffect(async () => {
        // make call to external system to reserve a token
        const response = await fetch('https://theSystemToReserveTheTokenIn:1234/api/tokens');
        if (!response.ok) {
            // this will lead to automatic retries
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    });

    await ctx.sideEffect(() => api.makeCall(request, idempotencyToken));
}


// ----------------------------------------------------------------------------
//  MOCKS FOR THE PATTERNS
// ----------------------------------------------------------------------------

const api = {
    makeCall: async (_request: any, _idempotencyToken: String) => Promise.resolve()
}