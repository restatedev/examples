// Sentry must be initialized before other imports
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});

const RESTATE_INGRESS = "http://localhost:8080";

// Convert sentry-trace header to W3C traceparent format
// sentry-trace: {trace_id}-{span_id}-{sampled}
// traceparent:  00-{trace_id}-{span_id}-{flags}
function sentryTraceToTraceparent(sentryTrace: string): string {
  const [traceId, spanId, sampled] = sentryTrace.split("-");
  const flags = sampled === "1" ? "01" : "00";
  return `00-${traceId}-${spanId}-${flags}`;
}

async function main() {
  const name = process.argv[2] || "World";

  console.log("=== Client App ===");
  console.log(`Calling Restate Greeter service with name: ${name}`);

  try {
    const result = await Sentry.startSpan(
      {
        name: "client-request",
        op: "http.client",
        attributes: { "request.name": name },
      },
      async (span) => {
        const traceId = span.spanContext().traceId;
        console.log(`Root Trace ID: ${traceId}`);
        console.log(
          `View in Sentry: Check your Sentry dashboard for trace ${traceId}`,
        );
        console.log("");

        // Get propagation headers from Sentry, convert to W3C for Restate
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const propagationContext = Sentry.getTraceData();
        if (propagationContext["sentry-trace"]) {
          // Restate uses OpenTelemetry which expects W3C traceparent format
          headers["traceparent"] = sentryTraceToTraceparent(
            propagationContext["sentry-trace"],
          );
        }

        console.log(`Injected trace context headers:`, {
          traceparent: headers["traceparent"],
        });

        const response = await fetch(`${RESTATE_INGRESS}/Greeter/greet`, {
          method: "POST",
          headers,
          body: JSON.stringify(name),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        return response.json();
      },
    );

    console.log(`Response: ${JSON.stringify(result)}`);
  } catch (err) {
    Sentry.captureException(err);
    console.error("Error:", err);
    process.exitCode = 1;
  } finally {
    await Sentry.close();
  }
}

main();
