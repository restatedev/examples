# The basic concepts of Restate in Python

The examples here showcase the most basic building blocks of Restate. **Durable Execution**,
**Durable Promises**, and **Virtual Objects**, and the **Workflows** abstraction built on top
of them.

The individual example files contain code snippets with comments and a brief descriptions
about how they work and how they can be run.

### Examples

* **[Services & Durable Execution](app/0_durable_execution.py):** Running code cleanly
  to the end in the presence of failures. Automatic retries and recovery of previously
  finished actions. The example applies creates a subscription to movie streaming services
  by first creating a recurring payment and then adding the subscriptions.

* **[Building blocks](app/1_building_blocks.py):** Restate gives you a durable version
  of common building blocks like queues, promises, RPC, state, and timers.
  This example shows a reference of the API and what you can do with it.

* **[Virtual Objects](app/2_virtual_objects.py):** Stateful serverless objects
  to manage durable consistent state and state-manipulating logic.

* **[Workflows](app/3_workflows.py):** Workflows are durable execution tasks that can
  be submitted and awaited. They have an identity and can be signaled and queried
  through durable promises. The example is a user-signup flow that takes multiple
  operations, including verifying the email address.


### Running the examples

To set up the example, use the following sequence of commands.

1. Setup the virtual env:
    ```shell
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

3. Start the app as follows:
   - Durable execution example: `python -m hypercorn --config hypercorn-config.toml app/0_durable_execution.py:app`
   - The building blocks example is not runnable and more like a reference of what you can do with the API
   - Virtual Objects example: `python -m hypercorn --config hypercorn-config.toml app/2_virtual_objects.py:app`
   - Workflows example: `python -m hypercorn --config hypercorn-config.toml app/3_workflows.py:app`

4. Start the Restate Server ([other options here](https://docs.restate.dev/develop/local_dev)):
    ```shell
    restate-server
    ```

5. Register the service:
    ```shell
    restate deployments register http://localhost:9080 --force
    ```
    _Note: the '--force' flag here is to circumvent all checks related to graceful upgrades, because it is only a playground, not a production setup._

6. Check the comments in the example for how to interact with the example.

**NOTE:** When you get an error of the type `{"code":"not_found","message":"Service 'greeter' not found. ...}`, then you forgot step (5) for that example.
