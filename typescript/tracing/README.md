# End-to-End OpenTelemetry Tracing with Restate

This example demonstrates distributed tracing across a fictional multi-tier system:

```
┌──────────┐     ┌─────────────┐     ┌─────────────────┐     ┌────────────┐
│  Client  │────▶│   Restate   │────▶│ Greeter Service │────▶│ Downstream │
│   App    │     │   Server    │     │   (SDK/Node)    │     │  Service   │
└──────────┘     └─────────────┘     └─────────────────┘     └────────────┘
     │                  │                     │                     │
     │                  │                     │                     │
     ▼                  ▼                     ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                Jaeger                                  │
└────────────────────────────────────────────────────────────────────────┘
```

**What gets traced:**

1. **Client App** - Creates the root span and injects W3C trace context into the Restate request
2. **Restate Server** - Receives trace context, emits spans for ingress requests and handler invocations
3. **Greeter Service** - SDK handler that creates custom spans and propagates context to downstream calls
4. **Downstream Service** - Receives and logs the propagated trace headers

## Prerequisites

- Node.js 18+
- Docker (for Jaeger)

## Setup

### 1. Start Jaeger

```bash
docker run -d --name jaeger \
  -p 4317:4317 \
  -p 16686:16686 \
  jaegertracing/all-in-one:latest
```

Jaeger UI will be available at `http://localhost:16686`

### 2. Install dependencies

```bash
npm install
```

### 3. Start Restate Server with tracing enabled

```bash
npx @restatedev/restate-server --tracing-endpoint http://localhost:4317
```

### 4. Start the downstream service (terminal 1)

```bash
npm run downstream
```

### 5. Start the Greeter service (terminal 2)

```bash
npm run service
```

### 6. Register the service with Restate

```bash
npx @restatedev/restate deployments register http://localhost:9080
```

### 7. Run the client

```bash
npm run client Alice
```

## Viewing Traces

After running the client, you'll see output like:

```
Root Trace ID: abc123...
View in Jaeger: `http://localhost:16686/trace/abc123...`
```

Open the Jaeger link to see the complete distributed trace spanning all four components.

## What You'll See in Jaeger

The trace will show spans from all four services:

- **client-app**: The root `client-request` span
- **Greeter**: Restate server spans for ingress, invoke, and journal operations
- **restate-greeter-service**: Custom `Greeter.greet` span with events
- **downstream-service**: `handle-request` span (may show errors due to 50% failure rate)

![Jaeger trace showing end-to-end spans](trace.png)

## Key Pattern: Extracting Trace Context in TypeScript SDK

The Restate server propagates W3C trace context to handlers via HTTP headers. In the TypeScript SDK, you need to manually extract this from `ctx.request().attemptHeaders`:

```typescript
import { context, propagation, Context } from "@opentelemetry/api";

function extractTraceContext(ctx: restate.Context): Context {
  const headers = ctx.request().attemptHeaders;
  const traceparent = headers.get("traceparent");
  const tracestate = headers.get("tracestate");

  const carrier: Record<string, string> = {};
  if (traceparent) {
    carrier["traceparent"] = Array.isArray(traceparent)
      ? traceparent[0]
      : traceparent;
  }
  if (tracestate) {
    carrier["tracestate"] = Array.isArray(tracestate)
      ? tracestate[0]
      : tracestate;
  }
  return propagation.extract(context.active(), carrier);
}
```

Then run your handler logic within that context:

```typescript
const traceContext = extractTraceContext(ctx);
return context.with(traceContext, () => {
  const span = tracer.startSpan("MyHandler");
  // ... your logic here, span is now a child of Restate's span
});
```

## Files

- `src/client.ts` - Client app that initiates traced requests
- `src/restate-service.ts` - Restate Greeter service with OpenTelemetry instrumentation
- `src/downstream.ts` - HTTP server with tracing and random failure rate
