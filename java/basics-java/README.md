# Examples of the basic concepts for Restate in Java

The examples here showcase the most basic building blocks of Restate. **Durable Execution**,
**Durable Promises**, and **Virtual Objects**, and the **Workflows** abstraction built on top
of them.

The individual example files contain code snippets with comments and a brief descriptions
about how they work and how they can be run.

### Examples

* **[Basic Durable Execution:](src/main/java/durable_execution/RoleUpdateService.java):** Running code cleanly
  to the end in the presence of failures. Automatic retries and recovery of previously
  finished actions. The example applies a series of updates and permission setting changes
  to user's profile.
    ```shell
    ./gradlew -PmainClass=durable_execution.RoleUpdateService run
    ```

* **[Durable Execution with Compensations](src/main/java/durable_execution_compensation/RoleUpdateService.java):**
  Reliably compensating / undoing previous actions upon unrecoverable errors halfway
  through multi-step change. This is the same example as above, extended for cases where
  a part of the change cannot be applied (conflict) and everything has to roll back.
    ```shell
    ./gradlew -PmainClass=durable_execution_compensation.RoleUpdateService run
    ```

* **[Workflows](src/main/java/workflows/SignupWorkflow.java):** Workflows are durable execution tasks that can
  be submitted and awaited. They have an identity and can be signaled and queried
  through durable promises. The example is a user-signup flow that takes multiple
  operations, including verifying the email address.

* **[Virtual Objects](src/main/java/virtual_objects/GreeterObject.java):** Stateful serverless objects
  to manage durable consistent state and state-manipulating logic.
    ```shell
    ./gradlew -PmainClass=virtual_objects.GreeterObject run
    ```

* **[Kafka Event-processing](src/main/java/events_processing/UserUpdatesService.java):** Processing events to
  update various downstream systems with durable event handlers, event-delaying,
  in a strict-per-key order.
    ```shell
    ./gradlew -PmainClass=events_processing.UserUpdatesService run
    ```

* **[Stateful Event-processing](src/main/java/events_state/ProfileService.java):** Populating state from
  events and making is queryable via RPC handlers.
    ```shell
    ./gradlew -PmainClass=events_state.ProfileService run
    ```


### Running the examples

1. Start Restate Server in a separate shell: `npx restate-server`

2. Start the relevant example. The commands are listed above for each example.

3. Register the example at Restate server by calling
   `npx restate -y deployment register --force localhost:9080`.

   _Note: the '--force' flag here is to circumvent all checks related to graceful upgrades, because it is only a playground, not a production setup._

4. Check the comments in the example for how to interact with the example.

**NOTE:** When you get an error of the type `{"code":"not_found","message":"Service 'greeter' not found. ...}`, then you forgot step (3) for that example.
