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
} from "@opentelemetry/api";

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: "client-app",
  }),
  traceExporter: new OTLPTraceExporter({
    url: "http://localhost:4317",
  }),
});

sdk.start();

const RESTATE_INGRESS = "http://localhost:8080";
const tracer = trace.getTracer("client-app");

async function main() {
  const name = process.argv[2] || "World";

  console.log("=== Client App ===");
  console.log(`Calling Restate Greeter service with name: ${name}`);

  // Create the root span for this request
  const rootSpan = tracer.startSpan("client-request", {
    kind: SpanKind.CLIENT,
    attributes: {
      "request.name": name,
    },
  });

  try {
    const result = await context.with(
      trace.setSpan(context.active(), rootSpan),
      async () => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        propagation.inject(context.active(), headers);
        console.log(`Injected W3C trace context headers:`, headers);

        const traceId = rootSpan.spanContext().traceId;
        console.log(`Root Trace ID: ${traceId}`);
        console.log(`View in Jaeger: http://localhost:16686/trace/${traceId}`);
        console.log("");

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

    rootSpan.addEvent("response_received", {
      "response.value": JSON.stringify(result),
    });
    rootSpan.setStatus({ code: SpanStatusCode.OK });

    console.log(`Response: ${JSON.stringify(result)}`);
  } catch (err) {
    rootSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: err instanceof Error ? err.message : "Unknown error",
    });
    console.error("Error:", err);
    process.exitCode = 1;
  } finally {
    rootSpan.end();
    await sdk.shutdown();
  }
}

main();
