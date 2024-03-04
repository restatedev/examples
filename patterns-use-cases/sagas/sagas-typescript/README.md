# SAGAs / Compensations

An example of a trip reservation workflow, using the SAGAs pattern to
undo previous steps in csase of an error.
This is a minimal version of the holiday reservation demo in the
[Restate Holiday Repository](https://github.com/restatedev/restate-holiday).

Durable Execution's guarantee to run code to the end in the presence
of failures, and to deterministically recover previous steps from the
journal, makes SAGAs easy.
Every step pushes a compensation action (an undo operation) to a stack.
in the case of an error, those operations are run.

The main requirement is that steps are implemented as journalled
operations, like `ctx.sideEffect()` or `ctx.rpc()`.
