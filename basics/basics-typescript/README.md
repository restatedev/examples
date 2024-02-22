# Examples of the basic concepts for Restate in TypeScript / JavaScript

The examples here showcase the most basic building blocks of Restate. **durable execution**,
**durable promises**, and **virtual objects**, and the **workflows** abstraction built on top
of them.

The individual example files contain code snippets with comments and a brief descriptions
about how they work and how they can be run.  

### Examples

* **[Basic Durable Execution:](src/1_durable_execution.ts):** Running code cleanly
  to the end in the presence of failures. Automatic retries and recovery of previously
  finished actions. The example applies a series of updates and permission setting changes
  to user's profile.

* **[Durable Execution with Compensations](src/2_durable_execution_compensation.ts):**
  Reliably compensating / undoing previous actions upon unrecoverable errors halfway
  through multi-step change. This is the same example as above, extended for cases where
  a part of the change cannot be applied (conflict) and everything has to roll back.

* **[Workflows](src/3_workflows.ts):** Workflows are durable execution tasks that can
  be submitted and awaited. They have an identity and can be signaled and queried
  through durable promises. The example is a user-signup flow that takes multiple
  operations, including verifying the email address. 

* **[Virtual Objects (state)](src/4_virtual_objects_state.ts):** Stateful objects with
  identities and methods that share durable consistent state.
  The example is a stateful greeter service that remembers how often each person said
  hello. _Stateful serverless_ in a nutshell.
  
* **[Virtual Objects (concurrency)](src/5_virtual_objects_concurrency.ts):**
  Concurrency and queueing of method calls on Virtual Objects. The example uses the
  single-writer-per-object semantics to build a state machine that ensures no
  concurrent conflicting actions can happen.


### Running the examples

1. Make sure you have installed the dependencies: `npm install`.

2. Start Restate Server in a separate shell: `npx restate-server`

3. Start the relevant example, i.e., `npm run example-1` for the first example.

4. If the example is deployed as a service or endpoint (rather than a local function), register
   that endpoint at Restate server by calling `npx restate -y deployment register --force "localhost:9080"`
   from a separate terminal.

   If the example is implemented as a local function, this step  not necessary.

   _Note: the '--force' flag here is to let the new example's deployment override the previous example's._
   _That's fine here, because it is only a playground, not a production setup._


5. Check the comments in the example for how to interact with the example.

**NOTE:** When you get an error of the type _'{"code":"not_found","message":"Service 'greeter' not found. ...}'_,
then you forgot step (4) for that example.
