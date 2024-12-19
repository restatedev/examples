# Use Cases and Patterns

Examples of common Use Cases and Patterns in distributed systems, implemented with
Restate.


### Examples

* **[Durable Promises/Futures:](durable-promises):** An implementation of Promises/Futures
that are durable cross processes and failures. Can be used to build simple reliable callbacks,
communicate/signal between systems, or to decouple sender/receiver.

* **[State Machines](state-machines):** A state machine with a set of transitions. By building
  it as a Restate Virtual Object, it has automatic state persistence, and concurrency safety
  that avoids accidental corruption and race conditions issues.

* **[Payment State Machine](payment-state-machine):** A special state machine example that
  track a payment process and ensures that processing and cancellations (refunding) always
  sort out consistently, regardless of concurrency and order of requests.

* **[Sagas](sagas):** The popular Saga pattern that runs a workflow and tracks compensation
  actions to reverse partial work in case the workflow cannot complete.
