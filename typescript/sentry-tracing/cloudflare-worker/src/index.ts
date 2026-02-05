import * as Sentry from "@sentry/cloudflare";
import * as restate from "@restatedev/restate-sdk-cloudflare-workers/fetch";

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
      console.log("Extracted sentryTrace:", sentryTrace);

      return Sentry.continueTrace({ sentryTrace, baggage: undefined }, () => {
        return Sentry.startSpan(
          {
            name: "Greeter.greet",
            op: "restate.handler",
            attributes: { name },
            forceTransaction: true,
          },
          async () => {
            Sentry.logger.info("Greeter request received", { name });

            // Simulate some work
            await ctx.sleep(200);

            return `Hello, ${name}!`;
          },
        );
      });
    },
  },
});

const restateHandler = restate.createEndpointHandler({ services: [greeter] });

interface Env {
  SENTRY_DSN: string;
}

// Note: Trace correlation between Sentry client and CF worker is limited because
// Restate Cloud doesn't forward traceparent as an HTTP header - it's only in
// Restate's protocol (attemptHeaders). The withSentry wrapper creates its own
// trace before we can access attemptHeaders.
// Inject sentry-trace header from traceparent before Sentry sees the request
function injectSentryTraceHeader(request: Request): Request {
  const traceparent = request.headers.get("traceparent");
  if (traceparent && !request.headers.get("sentry-trace")) {
    const sentryTrace = traceparentToSentryTrace(traceparent);
    const headers = new Headers(request.headers);
    headers.set("sentry-trace", sentryTrace);
    return new Request(request, { headers });
  }
  return request;
}

const sentryWrapped = Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
    _experiments: { enableLogs: true },
  }),
  {
    async fetch(request, env, ctx) {
      return restateHandler(request, env, ctx);
    },
  },
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const modifiedRequest = injectSentryTraceHeader(request);
    console.log("Injected sentry-trace:", modifiedRequest.headers.get("sentry-trace"));
    return sentryWrapped.fetch(modifiedRequest, env, ctx);
  },
};
