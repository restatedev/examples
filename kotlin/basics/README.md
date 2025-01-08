# The basic concepts of Restate in Java

The examples here showcase the most basic building blocks of Restate. **Durable Execution**,
**Durable Promises**, and **Virtual Objects**, and the **Workflows** abstraction built on top
of them.

The individual example files contain code snippets with comments and a brief descriptions
about how they work and how they can be run.

### Examples

* **[Services & Durable Execution](src/main/java/durable_execution/SubscriptionService.java):** Running code cleanly
  to the end in the presence of failures. Automatic retries and recovery of previously
  finished actions. The example applies creates a subscription to movie streaming services
  by first creating a recurring payment and then adding the subscriptions.

* **[Building blocks](src/main/java/building_blocks/MyService.java):** Restate gives you a durable version
  of common building blocks like queues, promises, RPC, state, and timers.
  This example shows a reference of the API and what you can do with it.

* **[Virtual Objects](src/main/java/virtual_objects/GreeterObject.java):** Stateful serverless objects
  to manage durable consistent state and state-manipulating logic.

* **[Workflows](src/main/java/workflows/SignupWorkflow.java):** Workflows are durable execution tasks that can
  be submitted and awaited. They have an identity and can be signaled and queried
  through durable promises. The example is a user-signup flow that takes multiple
  operations, including verifying the email address.

### Running the examples

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell:
   `restate-server`

2. Start the relevant example:
  - `./gradlew -PmainClass=durable_execution.SubscriptionServiceKt run` for the Durable Execution example
  - The building blocks example is not runnable and more like a reference of what you can do with the API
  - `./gradlew -PmainClass=workflows.SignupWorkflowKt run` for the Workflows example
  - `./gradlew -PmainClass=virtual_objects.GreeterObjectKt run` for the Virtual Objects example

3. Register the example at Restate server by calling
   `restate -y deployment register --force localhost:9080`.

   _Note: the '--force' flag here is to circumvent all checks related to graceful upgrades, because it is only a playground, not a production setup._

4. Check the comments  at the bottom of each example for how to interact with the example.

**NOTE:** When you get an error of the type `{"code":"not_found","message":"Service 'greeter' not found. ...}`, then you forgot step (3) for that example.
