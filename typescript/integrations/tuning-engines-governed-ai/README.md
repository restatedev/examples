# Tuning Engines governed AI with Restate

This example shows a Restate service handler calling the Tuning Engines
OpenAI-compatible endpoint. Restate owns durable execution and retries; Tuning
Engines owns model routing, policy checks, budgets, approvals, traces, and
runtime state references.

## Setup

```bash
npm install
export TE_INFERENCE_KEY=sk-te-your-inference-key
export TE_MODEL=auto
```

## Run

Start Restate locally:

```bash
npx @restatedev/restate-server
```

Start the service:

```bash
npm run service
```

Register the service:

```bash
npx @restatedev/restate deployments register http://localhost:9080
```

Invoke the handler using the normal Restate CLI or SDK flow. The handler passes
`run_id` and `request_id` metadata so Tuning Engines can correlate model usage,
policy decisions, approvals, and traces back to the Restate invocation.

## Files

- `src/app.ts` - Restate service with a governed model call.
- `package.json` - Minimal TypeScript project setup.
- `tsconfig.json` - TypeScript compiler settings.
