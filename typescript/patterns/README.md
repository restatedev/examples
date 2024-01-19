# Restate Sample Patterns

A collections of useful patterns in distributed applications, and how to
implement them with [Restate](https://github.com/restatedev/).
This is a continuously evolving list.

The patterns currently exist only in TypeScript/JavaScript, other languages
will be added soon.

All patterns are described in one file and have a comment block at the top
that explains them.

### List of Patterns

- [**Durable Event-based Asynchronous Communication as RPC**](src/async_calls_as_rpc.ts)
- [**Idempotency Tokens**](src/deterministic_idempotency_tokens.ts)
- [**Single-writer Concurrency**](src/single_writer_concurrency.ts)
- [**Dual Writes**](src/dual_writes.ts)
- [**Distributed Locks**](src/distributed_locks.ts)
- [**Idempotent DynamoDB Updates**](src/dynamo_db_idempotency.ts)
- [**Compensations**](src/compensations.ts)
