// OpenTelemetry must be initialized before other imports
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import {
  trace,
  context,
  propagation,
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
import { openTelemetryHook } from "@restatedev/restate-sdk-opentelemetry";

const DOWNSTREAM_URL = "http://localhost:3000/api/process";

const tracer = trace.getTracer("greeter-service");

const greeter = restate.service({
  name: "Greeter",
  handlers: {
    greet: async (ctx: restate.Context, name: string): Promise<string> => {
      // This span is created automatically by the hook we install below
      const span = trace.getActiveSpan()!;
      span.addEvent("processing_started", { name });

      const greeting = `Hello, ${name}!`;

      // Execute ctx.run -> this will create a child span, parent of the attempt span.
      const downstreamResult = await ctx.run("call-downstream", () =>
        // OTEL context is propagated downstream here as well
        callDownstreamWithTrace(name),
      );

      span.addEvent("downstream_completed", {
        "downstream.result": JSON.stringify(downstreamResult),
      });

      return greeting;
    },
  },
  options: {
    // Set up the OTEL hook
    hooks: [openTelemetryHook({ tracer })]
  }
});

async function callDownstreamWithTrace(
  name: string,
): Promise<{ status: string; receivedTrace: boolean }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  propagation.inject(context.active(), headers);

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
