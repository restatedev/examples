---
apply: by model decision
instructions: Guidelines for working with Restate durable services in this project
---

# Restate Java project

This project uses [Restate](https://restate.dev) — a durable execution runtime for resilient services, workflows, and AI agents. Restate captures every completed step so handlers can resume exactly where they left off after crashes, restarts, or retries.

## Core concepts

- **Services** — stateless handlers that run deterministically; retries resume from the last durable step.
- **Virtual Objects** — stateful, key-addressed handlers. State lives in Restate; Restate serializes per-key access.
- **Workflows** — long-running, multi-step flows with a single lifecycle per key.
- **Contexts** — every handler receives `Context`, `ObjectContext`, `WorkflowContext` (or their `Shared` variants). All non-deterministic work (I/O, random, time, RPC) must go through the context so it is journaled.

## Rules for this codebase

- Never perform side effects directly. Wrap I/O, randomness, timers, and RPCs in `ctx.run(...)`, `ctx.sleep(...)`, etc., so they are durable.
- Keep handler code deterministic between journal entries: same inputs must produce the same sequence of context calls.
- Prefer the typed client APIs (`XxxClient.fromContext(ctx, key)`) for service-to-service calls instead of raw HTTP.
- Serializable inputs/outputs only — use Jackson-compatible POJOs or records.

## Getting more detail

For API reference, lifecycle semantics, debugging, migration guidance, Kafka/idempotency patterns, and framework integrations (Quarkus, Spring Boot), query the **`restate-docs` MCP server** configured for this project (`.ai/mcp/mcp.json`). It's bound to `https://docs.restate.dev/mcp` and can search the full documentation on demand.

Useful entry points the MCP server can resolve:
- SDK API and pitfalls
- Designing services and picking a service type
- Invocation lifecycle, cancellation, idempotency, sends, Kafka
- Debugging stuck invocations and journal mismatches
