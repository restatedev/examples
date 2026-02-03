// OpenTelemetry must be initialized before other imports
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import {
  trace,
  context,
  propagation,
  SpanKind,
  SpanStatusCode,
  type Context,
} from "@opentelemetry/api";

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: "restate-greeter-service",
  }),
  traceExporter: new OTLPTraceExporter({
    url: "http://localhost:4317",
  }),
});

sdk.start();

import * as restate from "@restatedev/restate-sdk";

const DOWNSTREAM_URL = "http://localhost:3000/api/process";

const tracer = trace.getTracer("greeter-service");

// Extract trace context propagated by Restate via attempt headers.
//
// Unlike Java/Go, Node.js does have OTEL auto-instrumentation packages, but they
// operate at the raw HTTP transport level. Restate wraps the HTTP layer and provides
// durable execution semantics — a handler may be replayed multiple times. Extracting
// from ctx.request().attemptHeaders ensures one span per logical invocation,
// correctly positioned in the trace hierarchy regardless of retries.
function extractTraceContext(ctx: restate.Context): Context {
  const headers = ctx.request().attemptHeaders;
  // Use a TextMapGetter so any propagator format (W3C, B3, Jaeger…) is supported
  return propagation.extract(context.active(), headers, {
    get: (carrier, key) => {
      const val = carrier.get(key);
      return Array.isArray(val) ? val[0] : (val ?? undefined);
    },
    keys: (carrier) => [...carrier.keys()],
  });
}

const greeter = restate.service({
  name: "Greeter",
  handlers: {
    greet: async (ctx: restate.Context, name: string): Promise<string> => {
      const traceContext = extractTraceContext(ctx);

      // Create span under the extracted trace context
      const span = tracer.startSpan(
        "Greeter.greet",
        { kind: SpanKind.INTERNAL, attributes: { "greeter.name": name } },
        traceContext,
      );

      // Create context with our span as parent for downstream calls
      const spanContext = trace.setSpan(traceContext, span);

      return context.with(spanContext, () => {
        return (async () => {
          try {
            span.addEvent("processing_started", { name });

            const greeting = `Hello, ${name}!`;

            // Call downstream - our span becomes the parent
            const downstreamResult = await ctx.run("call-downstream", () =>
              callDownstreamWithTrace(name, spanContext),
            );

            span.addEvent("downstream_completed", {
              "downstream.result": JSON.stringify(downstreamResult),
            });

            span.setStatus({ code: SpanStatusCode.OK });
            return greeting;
          } catch (err) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: err instanceof Error ? err.message : "Unknown error",
            });
            throw err;
          } finally {
            span.end();
          }
        })();
      });
    },
  },
});

async function callDownstreamWithTrace(
  name: string,
  traceContext: Context,
): Promise<{ status: string; receivedTrace: boolean }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  propagation.inject(traceContext, headers);

  const response = await fetch(DOWNSTREAM_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(`Downstream failed: ${body.error ?? response.statusText}`);
  }

  return response.json() as Promise<{ status: string; receivedTrace: boolean }>;
}

restate.serve({
  services: [greeter],
  port: 9080,
});

process.on("SIGTERM", () => {
  sdk.shutdown().then(() => process.exit(0));
});
