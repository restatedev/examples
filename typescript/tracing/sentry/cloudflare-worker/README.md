# Restate Greeter Service on Cloudflare Workers with Sentry Tracing

This is the Cloudflare Workers version of the Greeter service with Sentry tracing.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Sentry DSN

Add your Sentry DSN as an environment variable. For local development, create a `.dev.vars` file:

```
SENTRY_DSN=https://xxx@xxx.ingest.us.sentry.io/xxx
```

For production, set it via Wrangler:

```bash
wrangler secret put SENTRY_DSN
```

### 3. Local development

```bash
npm run dev
```

This starts the worker on `http://localhost:9080`.

### 4. Register with Restate

```bash
npx @restatedev/restate deployments register http://localhost:9080
```

### 5. Deploy to Cloudflare

```bash
npm run deploy
```

Then register your deployed worker URL with Restate Cloud.

## Trace Propagation

The worker extracts W3C `traceparent` headers from Restate's attempt headers and converts them to Sentry's trace format. This allows distributed traces to connect:

1. Client/Restate Cloud sends `traceparent` header
2. Worker converts to `sentry-trace` format and continues the trace
3. Downstream calls include `sentry-trace` header for further propagation
