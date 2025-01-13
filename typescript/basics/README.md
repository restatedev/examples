# The basic concepts of Restate in TypeScript / JavaScript

The examples here showcase the most basic building blocks of Restate. **Durable Execution**,
**Durable Promises**, and **Virtual Objects**, and the **Workflows** abstraction built on top
of them.

The individual example files contain code snippets with comments and a brief descriptions
about how they work and how they can be run.  

### Examples

* **[Services & Durable Execution](src/0_durable_execution.ts):** Running code cleanly
  to the end in the presence of failures. Automatic retries and recovery of previously
  finished actions. The example applies creates a subscription to movie streaming services
  by first creating a recurring payment and then adding the subscriptions.

* **[Building blocks](src/1_building_blocks.ts):** Restate gives you a durable version
  of common building blocks like queues, promises, RPC, state, and timers.
  This example shows a reference of the API and what you can do with it.

* **[Virtual Objects](src/2_virtual_objects.ts):** Stateful serverless objects
  to manage durable consistent state and state-manipulating logic.

* **[Workflows](src/3_workflows.ts):** Workflows are durable execution tasks that can
  be submitted and awaited. They have an identity and can be signaled and queried
  through durable promises. The example is a user-signup flow that takes multiple
  operations, including verifying the email address. 

### Running the examples

1. Make sure you have installed the dependencies: `npm install`.

2. Start Restate Server in a separate shell: `npx restate-server`

3. Start the relevant example:
   - `npm run example-0` for the Durable Execution example
   - The building blocks example is not runnable and more like a reference of what you can do with the API
   - `npm run example-2` for the Virtual Objects example
   - `npm run example-3` for the Workflows example

4. Register the example at Restate server by calling
   `npx restate -y deployment register --force "localhost:9080"`.

   _Note: the '--force' flag here is to circumvent all checks related to graceful upgrades, because it is only a playground, not a production setup._

5. Check the comments at the bottom of each example for how to send requests to the example.

**NOTE:** When you get an error of the type `{"code":"not_found","message":"Service 'greeter' not found. ...}`, then you forgot step (4) for that example.
