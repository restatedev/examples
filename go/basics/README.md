# Examples of the basic concepts for Restate in TypeScript / JavaScript

The examples here showcase the most basic building blocks of Restate. **Durable Execution**,
**Durable Promises**, and **Virtual Objects**, and the **Workflows** abstraction built on top
of them.

The individual example files contain code snippets with comments and a brief descriptions
about how they work and how they can be run.

### Examples

* **[Durable Execution](src/1_durable_execution.ts):** Running code cleanly
  to the end in the presence of failures. Automatic retries and recovery of previously
  finished actions. The example applies creates a subscription to movie streaming services
  by first creating a recurring payment and then adding the subscriptions.

* **[Workflows](src/2_workflows.ts):** Workflows are durable execution tasks that can
  be submitted and awaited. They have an identity and can be signaled and queried
  through durable promises. The example is a user-signup flow that takes multiple
  operations, including verifying the email address.

* **[Virtual Objects](src/3_virtual_objects.ts):** Stateful serverless objects
  to manage durable consistent state and state-manipulating logic.

### Running the examples

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell:
   `restate-server`

2. Start the relevant example:
    - `go run ./part1` for the Durable Execution example
    - `go run ./part2` for the Workflows example
    - `go run ./part3` for the Virtual Objects example

3. Register the example at Restate server by calling
   `restate -y deployment register --force "localhost:9080"`.

   _Note: the '--force' flag here is to circumvent all checks related to graceful upgrades, because it is only a playground, not a production setup._

4. Check the comments at the bottom of each example for how to send requests to the example.

**NOTE:** When you get an error of the type `{"code":"not_found","message":"Service 'greeter' not found. ...}`, then you forgot step (4) for that example.
