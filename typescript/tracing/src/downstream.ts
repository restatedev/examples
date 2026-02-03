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
import { createServer } from "node:http";

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: "downstream-service",
  }),
  traceExporter: new OTLPTraceExporter({
    url: "http://localhost:4317",
  }),
});

sdk.start();

const PORT = 3000;
const FAILURE_RATE = 0.5; // 50% chance

const tracer = trace.getTracer("downstream-service");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const server = createServer((req, res) => {
  // Extract trace context from incoming headers
  const carrier: Record<string, string> = {};
  const traceparent = req.headers["traceparent"];
  const tracestate = req.headers["tracestate"];

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

  const traceContext = propagation.extract(context.active(), carrier);

  // Run request handling within the extracted trace context
  context.with(traceContext, async () => {
    const span = tracer.startSpan("handle-request", {
      kind: SpanKind.SERVER,
      attributes: {
        "http.method": req.method,
        "http.url": req.url,
      },
    });

    try {
      // Simulate some work
      await sleep(50 + Math.random() * 100);

      // Random failure
      if (Math.random() < FAILURE_RATE) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Random failure",
        });
        span.addEvent("failure_triggered", { rate: FAILURE_RATE });

        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Random failure",
            receivedTrace: !!traceparent,
          }),
        );
        return;
      }

      span.addEvent("processing_complete");
      span.setStatus({ code: SpanStatusCode.OK });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", receivedTrace: !!traceparent }));
    } finally {
      span.end();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Downstream service listening on http://localhost:${PORT}`);
  console.log(`Failure rate: ${FAILURE_RATE * 100}%`);
});

process.on("SIGTERM", () => {
  sdk.shutdown().then(() => process.exit(0));
});
