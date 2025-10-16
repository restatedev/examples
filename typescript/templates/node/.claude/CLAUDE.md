# Restate TypeScript SDK Rules

## Core Concepts

* Restate provides durable execution: code automatically stores completed steps and resumes from where it left off on failures
* All handlers receive a `Context`/`ObjectContext`/`WorkflowContext`/`ObjectSharedContext`/`WorkflowSharedContext` object as the first argument
* Handlers can take one optional JSON-serializable input and must return a JSON-serializable output. Or specify the serializers.

## Service Types

### Basic Services

```ts {"CODE_LOAD::ts/src/develop/service.ts"}  theme={null}
import * as restate from "@restatedev/restate-sdk";

export const myService = restate.service({
  name: "MyService",
  handlers: {
    myHandler: async (ctx: restate.Context, greeting: string) => {
      return `${greeting}!`;
    },
  },
});

restate.serve({ services: [myService] });
```

### Virtual Objects (Stateful, Key-Addressable)

```ts {"CODE_LOAD::ts/src/develop/virtual_object.ts"}  theme={null}
import * as restate from "@restatedev/restate-sdk";

export const myObject = restate.object({
  name: "MyObject",
  handlers: {
    myHandler: async (ctx: restate.ObjectContext, greeting: string) => {
      return `${greeting} ${ctx.key}!`;
    },
    myConcurrentHandler: restate.handlers.object.shared(
      async (ctx: restate.ObjectSharedContext, greeting: string) => {
        return `${greeting} ${ctx.key}!`;
      }
    ),
  },
});

restate.serve({ services: [myObject] });
```

### Workflows

```ts {"CODE_LOAD::ts/src/develop/workflow.ts"}  theme={null}
import * as restate from "@restatedev/restate-sdk";

export const myWorkflow = restate.workflow({
  name: "MyWorkflow",
  handlers: {
    run: async (ctx: restate.WorkflowContext, req: string) => {
      // implement workflow logic here

      return "success";
    },

    interactWithWorkflow: async (ctx: restate.WorkflowSharedContext) => {
      // implement interaction logic here
      // e.g. resolve a promise that the workflow is waiting on
    },
  },
});

restate.serve({ services: [myWorkflow] });
```

## Context Operations

### State Management (Virtual Objects & Workflows only)

❌ Never use global variables - not durable, lost across replicas.
✅ Use `ctx.get()` and `ctx.set()` - durable and scoped to the object's key.

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#state"}  theme={null}
// Get state
const count = (await ctx.get<number>("count")) ?? 0;

// Set state
ctx.set("count", count + 1);

// Clear state
ctx.clear("count");
ctx.clearAll();

// Get all state keys
const keys = await ctx.stateKeys();
```

### Service Communication

#### Request-Response

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#service_calls"}  theme={null}
// Call a Service
const response = await ctx.serviceClient(myService).myHandler("Hi");

// Call a Virtual Object
const response2 = await ctx.objectClient(myObject, "key").myHandler("Hi");

// Call a Workflow
const response3 = await ctx.workflowClient(myWorkflow, "wf-id").run("Hi");
```

#### One-Way Messages

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#sending_messages"}  theme={null}
ctx.serviceSendClient(myService).myHandler("Hi");
ctx.objectSendClient(myObject, "key").myHandler("Hi");
ctx.workflowSendClient(myWorkflow, "wf-id").run("Hi");
```

#### Delayed Messages

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#delayed_messages"}  theme={null}
ctx.serviceSendClient(myService).myHandler(
    "Hi",
    restate.rpc.sendOpts({ delay: { hours: 5 } })
);
```

#### Generic Calls

Call a service without using the generated client, but just String names.

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#generic_call"}  theme={null}
const response = await ctx.genericCall({
  service: "MyObject",
  method: "myHandler",
  parameter: "Hi",
  key: "Mary", // drop this for Service calls
  inputSerde: restate.serde.json,
  outputSerde: restate.serde.json,
});
```

### Run Actions or Side Effects (Non-Deterministic Operations)

❌ Never call external APIs/DBs directly - will re-execute during replay, causing duplicates.
✅ Wrap in `ctx.run()` - Restate journals the result; runs only once.

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#durable_steps"}  theme={null}
const result = await ctx.run("my-side-effect", async () => {
  return await callExternalAPI();
});
```

### Deterministic randoms and time

❌ Never use `Math.random()` - non-deterministic and breaks replay logic.
✅ Use `ctx.rand.random()` or `ctx.rand.uuidv4()` - Restate journals the result for deterministic replay.

❌ Never use Date.now(), new Date() - returns different values during replay.
✅ Use `await ctx.date.now();` - Restate records and replays the same timestamp.

### Durable Timers and Sleep

❌ Never use setTimeout() or sleep from other libraries - not durable, lost on restarts.
✅ Use ctx.sleep() - durable timer that survives failures.

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#durable_timers"}  theme={null}
// Sleep
await ctx.sleep({ seconds: 30 });

// Schedule delayed call (different from sleep + send)
ctx.serviceSendClient(myService).myHandler(
    "Hi",
    restate.rpc.sendOpts({ delay: { hours: 5 } })
);
```

### Awakeables (External Events)

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#awakeables"}  theme={null}
// Create awakeable
const {id, promise} = ctx.awakeable<string>();

// Send ID to external system
await ctx.run(() => requestHumanReview(name, id));

// Wait for result
const review = await promise;

// Resolve from another handler
ctx.resolveAwakeable(id, "Looks good!");

// Reject from another handler
ctx.rejectAwakeable(id, "Cannot be reviewed");
```

### Durable Promises (Workflows only)

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#workflow_promises"}  theme={null}
// Wait for promise
const review = await ctx.promise<string>("review");

// Resolve promise
await ctx.promise<string>("review").resolve(review);
```

## Concurrency

Always use Restate combinators (`RestatePromise.all`, `RestatePromise.race`, `RestatePromise.any`, `RestatePromise.allSettled`) instead of JavaScript's native `Promise` methods - they journal execution order for deterministic replay.

### `RestatePromise.all()` - Wait for All

Returns when all futures complete. Use to wait for multiple operations to finish.

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#promise_all"}  theme={null}
// ❌ BAD
const results1 = await Promise.all([call1, call2]);

// ✅ GOOD
const claude = ctx.serviceClient(claudeAgent).ask("What is the weather?");
const openai = ctx.serviceClient(openAiAgent).ask("What is the weather?");
const results2 = await RestatePromise.all([claude, openai]);
```

### `RestatePromise.race()` - Race Multiple Operations

Returns immediately when the first future completes. Use for timeouts and racing operations.

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#promise_race"}  theme={null}
// ❌ BAD
const result1 = await Promise.race([call1, call2]);

// ✅ GOOD
const firstToComplete = await RestatePromise.race([
  ctx.sleep({ milliseconds: 100 }),
  ctx.serviceClient(myService).myHandler("Hi"),
]);
```

### RestatePromise.any() - First Successful Result

Returns the first successful result, ignoring rejections until all fail.

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#promise_any"}  theme={null}
// ❌ BAD - using Promise.any (not journaled)
const result1 = await Promise.any([call1, call2]);

// ✅ GOOD
const result2 = await RestatePromise.any([
  ctx.run(() => callLLM("gpt-4", prompt)),
  ctx.run(() => callLLM("claude", prompt))
]);
```

### `RestatePromise.allSettled()` - Wait for All (Success or Failure)

Returns results of all promises, whether they succeeded or failed.

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#promise_allsettled"}  theme={null}
// ❌ BAD
const results1 = await Promise.allSettled([call1, call2]);

// ✅ GOOD
const results2 = await RestatePromise.allSettled([
  ctx.serviceClient(service1).call(),
  ctx.serviceClient(service2).call()
]);

results2.forEach((result, i) => {
  if (result.status === "fulfilled") {
    console.log(`Call ${i} succeeded:`, result.value);
  } else {
    console.log(`Call ${i} failed:`, result.reason);
  }
});
```

### Invocation Management

```ts {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-actions.ts#cancel"}  theme={null}
const handle = ctx.serviceSendClient(myService).myHandler(
    "Hi",
    restate.rpc.sendOpts({ idempotencyKey: "my-key" })
);
const invocationId = await handle.invocationId;
const response = await ctx.attach(invocationId);

// Cancel invocation
ctx.cancel(invocationId);
```

## Serialization

### Default (JSON)

By default, TypeScript SDK uses built-in JSON support.

### Zod Schemas

For type safety and validation with Zod, install: `npm install @restatedev/restate-sdk-zod`

```typescript {"CODE_LOAD::ts/src/develop/serialization.ts#zod"}  theme={null}
import * as restate from "@restatedev/restate-sdk";
import { z } from "zod";
import { serde } from "@restatedev/restate-sdk-zod";

const Greeting = z.object({
  name: z.string(),
});

const GreetingResponse = z.object({
  result: z.string(),
});

const greeter = restate.service({
  name: "Greeter",
  handlers: {
    greet: restate.handlers.handler(
      { input: serde.zod(Greeting), output: serde.zod(GreetingResponse) },
      async (ctx: restate.Context, { name }) => {
        return { result: `You said hi to ${name}!` };
      }
    ),
  },
});
```

### Custom Serialization

```typescript {"CODE_LOAD::ts/src/develop/serialization.ts#service_definition"}  theme={null}
const myService = restate.service({
  name: "MyService",
  handlers: {
    myHandler: restate.handlers.handler(
      {
        // Set the input serde here
        input: restate.serde.binary,
        // Set the output serde here
        output: restate.serde.binary,
      },
      async (ctx: Context, data: Uint8Array): Promise<Uint8Array> => {
        // Process the request
        return data;
      }
    ),
  },
});
```

## Error Handling

Restate retries failures indefinitely by default. For permanent business-logic failures (invalid input, declined payment), use TerminalError to stop retries immediately.

### Terminal Errors (No Retry)

```typescript {"CODE_LOAD::ts/src/develop/error_handling.ts#terminal"}  theme={null}
throw new TerminalError("Something went wrong.", { errorCode: 500 });
```

### Retryable Errors

```typescript  theme={null}
// Any other thrown error will be retried
throw new Error("Temporary failure - will retry");
```

## Testing

```typescript {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-testing.test.ts"}  theme={null}
import { RestateTestEnvironment } from "@restatedev/restate-sdk-testcontainers";
import * as clients from "@restatedev/restate-sdk-clients";
import { describe, it, beforeAll, afterAll, expect } from "vitest";
import {greeter} from "./greeter-service";

describe("MyService", () => {
    let restateTestEnvironment: RestateTestEnvironment;
    let restateIngress: clients.Ingress;

    beforeAll(async () => {
        restateTestEnvironment = await RestateTestEnvironment.start({services: [greeter]});
        restateIngress = clients.connect({ url: restateTestEnvironment.baseUrl() });
    }, 20_000);

    afterAll(async () => {
        await restateTestEnvironment?.stop();
    });

    it("Can call methods", async () => {
        const client = restateIngress.objectClient(greeter, "myKey");
        await client.greet("Test!");
    });

    it("Can read/write state", async () => {
        const state = restateTestEnvironment.stateOf(greeter, "myKey");
        await state.set("count", 123);
        expect(await state.get("count")).toBe(123);
    });
});
```

## SDK Clients (External Invocations)

```typescript {"CODE_LOAD::ts/src/develop/agentsmd/agentsmd-clients.ts#here"}  theme={null}
const restateClient = clients.connect({url: "http://localhost:8080"});

// Request-response
const result = await restateClient
    .serviceClient<MyService>({name: "MyService"})
    .myHandler("Hi");

// One-way
await restateClient
    .serviceSendClient<MyService>({name: "MyService"})
    .myHandler("Hi");

// Delayed
await restateClient
    .serviceSendClient<MyService>({name: "MyService"})
    .myHandler("Hi", clients.rpc.sendOpts({delay: {seconds: 1}}));
```
