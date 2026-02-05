// Sentry must be initialized before other imports
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});

import { createServer } from "node:http";

const PORT = 3000;
const FAILURE_RATE = 0.5; // 50% chance

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const server = createServer((req, res) => {
  // Extract Sentry trace context from incoming headers
  const sentryTraceRaw = req.headers["sentry-trace"];
  const sentryTraceHeader = Array.isArray(sentryTraceRaw)
    ? sentryTraceRaw[0]
    : sentryTraceRaw;

  // Continue the trace from incoming headers
  Sentry.continueTrace(
    {
      sentryTrace: sentryTraceHeader,
      baggage: undefined,
    },
    async () => {
      await Sentry.startSpan(
        {
          name: "handle-request",
          op: "http.server",
          attributes: {
            "http.method": req.method ?? "unknown",
            "http.url": req.url ?? "/",
          },
        },
        async (span) => {
          try {
            // Simulate some work
            await sleep(50 + Math.random() * 100);

            // Random failure
            if (Math.random() < FAILURE_RATE) {
              span.setStatus({ code: 2, message: "Random failure" });

              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error: "Random failure",
                  receivedTrace: !!sentryTraceHeader,
                }),
              );
              return;
            }

            span.setStatus({ code: 1 });

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ status: "ok", receivedTrace: !!sentryTraceHeader }),
            );
          } catch (err) {
            Sentry.captureException(err);
            throw err;
          }
        },
      );
    },
  );
});

server.listen(PORT, () => {
  console.log(`Downstream service listening on http://localhost:${PORT}`);
  console.log(`Failure rate: ${FAILURE_RATE * 100}%`);
});

process.on("SIGTERM", async () => {
  await Sentry.close();
  process.exit(0);
});
