# SAGAs / Compensations

An example of a trip reservation workflow, using the SAGAs pattern to
undo previous steps in case of an error.

Durable Execution's guarantee to run code to the end in the presence
of failures, and to deterministically recover previous steps from the
journal, makes SAGAs easy.
Every step pushes a compensation action (an undo operation) to a stack.
in the case of an error, those operations are run.

The main requirement is that steps are implemented as journald
operations, like `ctx.run()` or rpc/messaging.
