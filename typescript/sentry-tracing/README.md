# End-to-End Sentry Tracing with Restate

This example demonstrates distributed tracing with Sentry across a multi-tier system:

```
┌──────────┐     ┌─────────────┐     ┌─────────────────┐     ┌────────────┐
│  Client  │────▶│   Restate   │────▶│ Greeter Service │────▶│ Downstream │
│   App    │     │   Server    │     │   (SDK/Node)    │     │  Service   │
└──────────┘     └─────────────┘     └─────────────────┘     └────────────┘
     │                                        │                     │
     │                                        │                     │
     ▼                                        ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                Sentry                                  │
└────────────────────────────────────────────────────────────────────────┘
```

**What gets traced:**

1. **Client App** - Creates the root span and injects Sentry trace context into the Restate request
2. **Greeter Service** - Extracts trace context from attempt headers, creates child spans, propagates to downstream
3. **Downstream Service** - Receives and continues the trace

## Prerequisites

- Node.js 18+
- A Sentry account with a DSN

## Setup

### 1. Get your Sentry DSN

Create a project in Sentry (or use an existing one) and get the DSN from **Settings > Projects > [Your Project] > Client Keys (DSN)**.

### 2. Install dependencies

```bash
npm install
```

### 3. Start Restate Server

```bash
npx @restatedev/restate-server
```

### 4. Start the downstream service (terminal 1)

```bash
SENTRY_DSN="https://xxx@xxx.ingest.us.sentry.io/xxx" npm run downstream
```

### 5. Start the Greeter service (terminal 2)

```bash
SENTRY_DSN="https://xxx@xxx.ingest.us.sentry.io/xxx" npm run service
```

### 6. Register the service with Restate

```bash
npx @restatedev/restate deployments register http://localhost:9080
```

### 7. Run the client

```bash
SENTRY_DSN="https://xxx@xxx.ingest.us.sentry.io/xxx" npm run client Alice
```

## Viewing Traces

After running the client, you'll see output like:

```
Root Trace ID: abc123...
View in Sentry: Check your Sentry dashboard for trace abc123...
```

Open your Sentry dashboard and navigate to **Performance > Traces** to see the distributed trace.

## What You'll See in Sentry

The trace will show spans from all three instrumented services:

- **client-request** - The root span from the client app
- **Greeter.greet** - The Restate handler span with custom attributes
- **handle-request** - The downstream service span (may show errors due to 50% failure rate)

## Key Pattern: Extracting Trace Context in TypeScript SDK

Sentry propagates trace context via `sentry-trace` and `baggage` headers. In the TypeScript SDK, extract these from `ctx.request().attemptHeaders`:

```typescript
import * as Sentry from "@sentry/node";

function extractTraceHeaders(ctx: restate.Context) {
  const headers = ctx.request().attemptHeaders;
  return {
    sentryTrace: headers.get("sentry-trace") ?? undefined,
    baggage: headers.get("baggage") ?? undefined,
  };
}
```

Then continue the trace and create your spans:

```typescript
const { sentryTrace, baggage } = extractTraceHeaders(ctx);

return Sentry.continueTrace({ sentryTrace, baggage }, async () => {
  return Sentry.startSpan({ name: "MyHandler", op: "restate.handler" }, async () => {
    // ... your logic here, span is now a child of the incoming trace
  });
});
```

## Propagating Context to Downstream Services

When making outbound HTTP calls, inject the current trace context:

```typescript
const propagationContext = Sentry.getTraceData();

const headers: Record<string, string> = { "Content-Type": "application/json" };
if (propagationContext["sentry-trace"]) {
  headers["sentry-trace"] = propagationContext["sentry-trace"];
}
if (propagationContext["baggage"]) {
  headers["baggage"] = propagationContext["baggage"];
}

await fetch(url, { headers, ... });
```

## Files

- `src/client.ts` - Client app that initiates traced requests
- `src/restate-service.ts` - Restate Greeter service with Sentry instrumentation
- `src/downstream.ts` - HTTP server with Sentry tracing and random failure rate
