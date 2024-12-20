# Examples of the basic concepts for Restate in TypeScript / JavaScript

The examples here showcase the most basic building blocks of Restate. **Durable Execution**,
**Durable Promises**, and **Virtual Objects**, and the **Workflows** abstraction built on top
of them.

The individual example files contain code snippets with comments and a brief descriptions
about how they work and how they can be run.  

### Examples

* **[Basic Durable Execution:](app/1_durable_execution.py):** Running code cleanly
  to the end in the presence of failures. Automatic retries and recovery of previously
  finished actions. The example applies a series of updates and permission setting changes
  to user's profile.

* **[Workflows](app/2_workflows.py):** Workflows are durable execution tasks that can
  be submitted and awaited. They have an identity and can be signaled and queried
  through durable promises. The example is a user-signup flow that takes multiple
  operations, including verifying the email address. 

* **[Virtual Objects](app/3_virtual_objects.py):** Stateful serverless objects
  to manage durable consistent state and state-manipulating logic.

### Running the examples

To set up the example, use the following sequence of commands.

1. Setup the virtual env:
    ```shell
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

3. Start the app as follows:
   - Durable execution example: `python -m hypercorn --config hypercorn-config.toml app/1_durable_execution.py:app`
   - Workflows example: `python -m hypercorn --config hypercorn-config.toml app/2_workflows.py:app`
   - Virtual Objects example: `python -m hypercorn --config hypercorn-config.toml app/3_virtual_objects.py:app`

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
