// Sentry must be initialized before other imports
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});

import * as restate from "@restatedev/restate-sdk";

const DOWNSTREAM_URL = "http://localhost:3000/api/process";

// Convert W3C traceparent to sentry-trace format
// traceparent:  00-{trace_id}-{span_id}-{flags}
// sentry-trace: {trace_id}-{span_id}-{sampled}
function traceparentToSentryTrace(traceparent: string): string {
  const parts = traceparent.split("-");
  if (parts.length !== 4) return traceparent;
  const [, traceId, spanId, flags] = parts;
  const sampled = flags === "01" ? "1" : "0";
  return `${traceId}-${spanId}-${sampled}`;
}

// Extract trace context from Restate's attempt headers
// Restate propagates W3C traceparent, so we convert to Sentry format
function extractSentryTrace(ctx: restate.Context): string | undefined {
  const headers = ctx.request().attemptHeaders;
  const traceparentRaw = headers.get("traceparent");
  const traceparent = Array.isArray(traceparentRaw)
    ? traceparentRaw[0]
    : traceparentRaw;

  return traceparent ? traceparentToSentryTrace(traceparent) : undefined;
}

const greeter = restate.service({
  name: "Greeter",
  handlers: {
    greet: async (ctx: restate.Context, name: string): Promise<string> => {
      const sentryTrace = extractSentryTrace(ctx);

      // Continue the trace from incoming headers
      return Sentry.continueTrace({ sentryTrace, baggage: undefined }, async () => {
        return Sentry.startSpan(
          {
            name: "Greeter.greet",
            op: "restate.handler",
            attributes: { "greeter.name": name },
          },
          async () => {
            try {
              const greeting = `Hello, ${name}!`;

              // Call downstream with trace propagation
              const downstreamResult = await ctx.run("call-downstream", () =>
                callDownstreamWithTrace(name),
              );

              console.log("Downstream result:", downstreamResult);

              return greeting;
            } catch (err) {
              Sentry.captureException(err);
              throw err;
            }
          },
        );
      });
    },
  },
});

async function callDownstreamWithTrace(
  name: string,
): Promise<{ status: string; receivedTrace: boolean }> {
  // Get propagation headers from current Sentry span
  const propagationContext = Sentry.getTraceData();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // Downstream is also Sentry-instrumented, so use sentry-trace format
  if (propagationContext["sentry-trace"]) {
    headers["sentry-trace"] = propagationContext["sentry-trace"];
  }

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

process.on("SIGTERM", async () => {
  await Sentry.close();
  process.exit(0);
});
