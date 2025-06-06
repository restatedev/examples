# TypeScript Patterns and Use Cases

Common tasks and patterns implemented with Restate:

#### Communication
- **[Durable RPC, Idempotency & Concurrency](README.md#durable-rpc-idempotency--concurrency)**: Use programmatic clients to call Restate handlers. Add idempotency keys for deduplication. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/durablerpc/express_app.ts)
- **[(Delayed) Message Queue](README.md#delayed-message-queue)**: Restate as a queue: Send (delayed) events to handlers. Optionally, retrieve the response later. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/queue/task_submitter.ts)
- **[Webhook Callbacks](README.md#webhook-callbacks)**: Point webhook callbacks to a Restate handler for durable event processing. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/webhookcallbacks/webhook_callback_router.ts)
- **[Database Interaction Patterns](README.md#database-interaction-patterns)**: Recommended approaches for reading from and writing to databases using Restate handlers. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/database/main.ts)
- **[Convert Sync Tasks to Async](README.md#convert-sync-tasks-to-async)**: Kick off a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/syncasync/client.ts)
- **[Batching](README.md#batching)**: Group RPCs into batches of a particular size, subject to a max wait time [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/batching/batcher.ts)
- **[Payments signals (Advanced)](README.md#payment-signals)**: Combining fast synchronous responses and slow async callbacks for payments, with Stripe. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/signalspayments/payment_service.ts)

#### Orchestration patterns
- **[Sagas](README.md#sagas)**: Preserve consistency by tracking undo actions and running them when code fails halfway through. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/sagas/booking_workflow.ts)
- **[Stateful Actors and State Machines](README.md#stateful-actors-and-state-machines)**: Stateful Actor representing a machine in our factory. Track state transitions with automatic state persistence. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/statefulactors/machine_operator.ts)
- **[Payment state machines (Advanced)](README.md#payment-state-machines)**: State machine example that tracks a payment process, ensuring consistent processing and cancellations. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/statemachinepayments/payment_service.ts)

#### Scheduling
- **[Cron Jobs](README.md#cron-jobs)**: Implement a cron service that executes tasks based on a cron expression. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/cron/cron_service.ts)
- **[Scheduling Tasks](#scheduling-tasks)**: Restate as scheduler: Schedule tasks for later and ensure the task is triggered and executed. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/schedulingtasks/payment_reminders.ts)
- **[Parallelizing work](README.md#parallelizing-work)**: Execute a list of tasks in parallel and then gather their result. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/parallelizework/fan_out_worker.ts)

#### Event processing
- **[Transactional Event Processing](README.md#transactional-event-processing)**: Process events from Kafka to update various downstream systems in a transactional way. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/eventtransactions/user_feed.ts)
- **[Event enrichment / Joins](README.md#event-enrichment--joins)**: Stateful functions/actors connected to Kafka and callable over RPC. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/eventenrichment/package_tracker.ts)

#### Building coordination constructs (Advanced)
Use Restate to build distributed coordination and synchronization constructs:
- **[Durable Promises as a Service](README.md#durable-promises-as-a-service)**: Building Promises/Futures as a service, that can be exposed to external clients and are durable across processes and failures. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/promiseasaservice)
- **[Priority Queue](README.md#priority-queue)**: Example of implementing a priority queue to manage task execution order. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/priorityqueue)
- **[Rate Limiting](README.md#rate-limiting)**: Example of implementing a token bucket rate limiter. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/ratelimit)

First, install the dependencies:

```shell
npm install
```

## Durable RPC, Idempotency & Concurrency
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/durablerpc/express_app.ts)

This example shows:
- **Durable RPC**: once a request has reached Restate, it is guaranteed to be processed
- **Exactly-once processing**: Ensure that duplicate requests are not processed multiple times via idempotency keys
- **Concurrency**: Restate executes requests to the same Virtual Object key sequentially, to ensure consistency of its K/V state

The example shows how you can programmatically submit a requests to a Restate service.
Every request gets processed durably, and deduplicated based on the idempotency key.

- The [client](src/durablerpc/express_app.ts) receives product reservation requests and forwards them to the product service.
- The [Product service](src/durablerpc/product_service.ts) is a Restate service that durably processes the reservation requests and deduplicates them. Each product can be reserved only once.

<details>
<summary><strong>Running the example</strong></summary>

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `npx tsx watch ./src/durablerpc/product_service.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`
4. Start the Express app: `npx tsx watch ./src/durablerpc/express_app.ts`

Send a request to the Express app to reserve a product:
```shell
curl -X POST localhost:5000/reserve/product1/reservation1
```
The response will be `true`.

Let's change the reservation ID and run the request again:
```shell
curl -X POST localhost:5050/reserve/product1/reservation2
```
This will give us `false` because this product is already reserved, so we can't reserve it again.

However, if we run the first request again with same reservation ID, we will get `true` again:
```shell
curl -X POST localhost:5050/reserve/product1/reservation1
```
Restate deduplicated the request (with the reservation ID as idempotency key) and returned the first response.

</details>

## (Delayed) Message Queue
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/queue/task_submitter.ts)

Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once.

- [Task Submitter](src/queue/task_submitter.ts): schedules tasks via send requests with and idempotency key.
    - The **send requests** put the tasks in Restate's queue. The task submitter does not wait for the task response.
    - The **idempotency key** in the header is used by Restate to deduplicate requests.
    - If a delay is set, the task will be executed later and Restate will track the timer durably, like a **delayed task queue**.
- [Async Task Worker](src/queue/async_task_worker.ts): gets invoked by Restate for each task in the queue.

## Database Interaction Patterns
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/database/main.ts)
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/read-guide.svg">](https://docs.restate.dev/guides/databases)

This set of examples shows various patterns to access databases from Restate handlers.

The basic premise is:

1. You don't need to do anything special, you can just interact with
   your database the same way as from other microservices or workflow activities.

2. But you can use Restate's state, journal, and concurrency mechanisms
   as helpers to improve common access problems, solve race conditions,
   or avoid inconsistencies in the presence of retries, concurrent requests,
   or zombie processes.

The code in [main.ts](./src/database/main.ts) walks gradually through those patterns and explains
them with inline comments.

<details>
<summary><strong>Running the Example</strong></summary>

_This is purely opional, the example code and comments document the behavior well._
_Running the example can be interesting, though, if you want to play with specific failure_
_scenarios, like pausing/killing processes at specific points and observe the behavior._

1. **Sample Postgres Instance**

To run this example, you need a PostgreSQL database that the Restate handlers will
access/modify. Simply start one using this Docker command (from the example directory,
i.e., the directory containing this README file!).

```shell
docker run -it --rm \
  --name restate_example_db \
  -e POSTGRES_USER=restatedb \
  -e POSTGRES_PASSWORD=restatedb \
  -e POSTGRES_DB=exampledb \
  -p 5432:5432 \
  -v "$(pwd)/db:/docker-entrypoint-initdb.d" \
  postgres:15.0-alpine
```

In a separate shell, you can check the contents of the database via those queries
(requires `psql` to be installed):
```shell
psql postgresql://restatedb:restatedb@localhost:5432/exampledb -c 'SELECT * FROM users;'
psql postgresql://restatedb:restatedb@localhost:5432/exampledb -c 'SELECT * FROM user_idempotency;'
```

2. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
3. Start the service: `npx tsx watch ./src/database/main.ts`
4. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

5. The below commands trigger the individual example handlers in the different services.

As with all Restate invocations, you can add idempotency keys to the invoking HTTP calls to make sure
retries from HTTP clients are de-duplicated by Restate.
Add an idempotency-key header by appending `-H 'idempotency-key: <mykey>'` to any command, for example: `curl -i localhost:8080/keyed/A/updateConditional --json '12' -H 'idempotency-key: abcdef'`.
As with all Restate handlers, if you invoke them from within another Restate handler via the Context, invocations are automatically made idempotent.

Simple DB operations:
* Simple read: `curl -i localhost:8080/simple/read -H 'content-type: application/json' -d '"A"'`
* Durable read: `curl -i localhost:8080/simple/durableRead -H 'content-type: application/json' -d '"B"'`
* Insert: `curl -i localhost:8080/simple/insert  -H 'content-type: application/json' -d '{ "userId": "C", "name": "Emm", "address": "55, Rue du Faubourg Saint-Honoré, 75008 Paris, France", "credits": 1337 }'`
* Update: `curl -i localhost:8080/simple/update  -H 'content-type: application/json' -d '{ "userId": "A", "newName": "Donald" }'`

Keyed DB Operations:
* Update simple: `curl -i localhost:8080/keyed/B/update -H 'content-type: application/json' -d '12'`
* Update exactly-once: `curl -i localhost:8080/keyed/B/updateConditional -H 'content-type: application/json' -d '12'`


Idempotency update:
* Updating exactly-once via idempotency: `curl -i localhost:8080/idempotency/update -H 'content-type: application/json' -d '{ "userId": "A", "addCredits": 100 }'`

Update using 2-phase-commit:
* Updating exactly-once via 2pc txn: `curl -i localhost:8080/twoPhaseCommit/update -H 'content-type: application/json' -d '{ "userId": "A", "addCredits": 100 }'`

</details>

## Webhook Callbacks
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/webhookcallbacks/webhook_callback_router.ts)
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/read-guide.svg">](https://docs.restate.dev/guides/durable-webhooks)

This example processes webhook callbacks from a payment provider.

Restate handlers can be used as the target for webhook callbacks.
This turns handlers into durable event processors that ensure the event is processed exactly once.

You don't need to do anything special!

## Convert Sync Tasks to Async
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/syncasync/data_upload_service.ts)

This example shows how to use the Restate SDK to **kick of a synchronous task and turn it into an asynchronous one if it takes too long**.

The example implements a [data upload service](src/syncasync/data_upload_service.ts), that creates a bucket, uploads data to it, and then returns the URL.

The [upload client](src/syncasync/client.ts) does a synchronous request to upload the file, and the server will respond with the URL.

If the upload takes too long, however, the client asks the upload service to send the URL later in an email.

<details>
<summary><strong>Running the example</strong></summary>

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `npx tsx watch ./src/syncasync/data_upload_service.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

Run the upload client with a userId: `npx tsx ./src/syncasync/client.ts`

This will submit an upload workflow to the data upload service.
The workflow will run only once per ID, so you need to provide a new ID for each run.

Have a look at the logs to see how the execution switches from synchronously waiting to the response to requesting an email.

</details>

## Batching
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/batching/batcher.ts)

This example shows how to group events into batches, subject to a maximum 'linger' period after which undersized batches will be sent.

A client submits items to the `receive` handler of the `batcher` object, which adds them to its state.
If the number of items hits a configured limit (in this case 10), the batch will be sent off to its real destination,
the `batchReceiver` object. If an expiration timer fires before the batch size is reached, an undersized batch is sent.

<details>
<summary><strong>Running the example</strong></summary>

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `npx tsx watch ./src/batching/batcher.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

Submit some work to be batched:
```shell
# add one item
curl localhost:8080/batcher/myKey/receive -H 'content-type: application/json' -d '123'
# add lots
for i in $(seq 1 31); do curl localhost:8080/batcher/myKey/receive -H 'content-type: application/json' -d "$i"; done
```

Have a look at the service logs to see how your messages are grouped together into batches.

</details>

## Payment Signals
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/signalspayments/payment_service.ts)

This example issues a payment request to Stripe.
When calling Stripe, the result often comes synchronously as a response API call.
But sometimes, an immediate answer is not possible, and especially some payment
methods (like IBAN transfers or Klarna) frequently only return "processing" to notify
you later via a webhook.

This example combines both paths in a single function that reliably waits for both
paths, if needed, thus giving you a single long-running synchronous function.
This is useful, for example, when the payment is processed completely asynchronously,
like during periodic charging of a subscription.

And because we have a durable execution system that suspends and resumes state
and promises, we can actually combine this into a single reliably promise/async-function.

<details>
<summary><strong>Running the example</strong></summary>

This example works end-to-end with Stripe. You need a Stripe account to run it.
If you want to run everything locally, you also need a tool like _ngrok_ to forward
webhooks to your local machine.

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `npx tsx watch ./src/signalspayments/payment_service.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

4. Create a free Stripe test account. This requires no verification, but you can only work
   with test data, not make real payments. Good enough for this example.

5. In the [Stripe UI](https://dashboard.stripe.com), go to ["Developers" -> "API Keys"](https://dashboard.stripe.com/test/apikeys) and copy the _secret key_ (`sk_test_...`).
   Add it to the [stripe_utils.ts](src/signalspayments/utils/stripe_utils.ts) file. Because this is a dev-only
   API key, it supports only test data, so it isn't super sensitive.

6. Run launch _ngrok_:
    1. [Get a free account](https://dashboard.ngrok.com)
    2. Copy your auth token (https://dashboard.ngrok.com/get-started/your-authtoken)
    3. Download the binary, or launch a docker container. Make it forward HTTP calls to local port `8080`:
        - `NGROK_AUTHTOKEN=<your token> ngrok http 8080`
        - or `docker run --rm -it -e NGROK_AUTHTOKEN=<your token> --network host ngrok/ngrok http 8080` (on Linux command).
          Copy the public URL that ngrok shows you: `https://<some random numbers>.ngrok-free.app`

7. Go to the Stripe UI and [create a webhook](https://dashboard.stripe.com/test/webhooks)
    - Put the ngrok public URL + `/payments/processWebhook` as the webhook URL (you need to update this whenever you stop/start ngrok).
      Example: `https://<some random numbers>.ngrok-free.app/payments/processWebhook`
    - Select all _"Payment Intent"_ event types.

8. Put the webhook secret (`whsec_...`) to the [stripe_utils.ts](./src/signalspayments/utils/stripe_utils.ts) file.

Use as test data `pm_card_visa` for a successful payment and `pm_card_visa_chargeDeclined` for a declined payment.
Because the test data rarely triggers an async response, this example's tools can mimic that
if you add `"delayedStatus": true` to the request.

```shell
curl localhost:8080/payments/processPayment -H 'content-type: application/json' -d '{
        "paymentMethodId": "pm_card_visa",
        "amount": 109,
        "delayedStatus": true
}'
```

A few notes:
* You would usually submit payment calls through Restate also with an idempotency token,
  like: ` -H 'idempotency-key: my-id-token'`
* The webhook setup with ngrok is not trivial and can easily be wrong. You might end up with
  some payments waiting for the webhooks. You can use the CLI to cancel them:
  `restate inv list` and `restate inv cancel <invocation_id>`.
* Here is an opportunity for the SAGAs pattern to cancel payments in that case.

</details>

## Sagas
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/sagas/booking_workflow.ts)
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/read-guide.svg">](https://docs.restate.dev/guides/sagas)

When building distributed systems, it is crucial to ensure that the system remains consistent even in the presence of failures.
One way to achieve this is by using the Saga pattern.

Sagas are a way to manage transactions that span multiple services.
They allow you to run compensations when your code crashes halfway through.
This way, you can ensure that your system remains consistent even in the presence of failures.

Restate guarantees that sagas run to completion. It will handle retries and failures, and ensure that compensations are executed successfully.

<img src="img/saga_diagram.svg" width="500" alt="Saga Workflow">

Note that the compensating actions need to be idempotent.

<img src="img/saga_journal.png" width="1200px" alt="Saga Journal">

<details>
<summary><strong>Running the example</strong></summary>

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: 
```shell
restate-server`
```
2. Start the service: 
```shell
npx tsx watch ./src/sagas/booking_workflow.ts
```
3. Register the services (with `--force` to override the endpoint during **development**): 
```shell
restate -y deployments register --force localhost:9080
```

Have a look at the logs to see how the compensations run in case of a terminal error.

Start the workflow:
```shell
curl localhost:8080/BookingWorkflow/run --json '{
  "customerId": "12345",
  "flights": {
    "flightId": "12345",
    "passengerName": "John Doe"
  },
  "car": {
    "pickupLocation": "Airport",
    "rentalDate": "2024-12-16"
  },
  "hotel": {
    "arrivalDate": "2024-12-16",
    "departureDate": "2024-12-20"
  }
}'
```

Have a look at the logs to see the cancellations of the flight and car booking in case of a terminal error

<details>
<summary><strong>View logs</strong></summary>

```shell
[restate][2025-05-29T15:10:01.707Z][BookingWorkflow/run][inv_144nN2pVmQaD6zGbwQFeMtadyzSIP4dzFf] INFO: Starting invocation.
Flight booked for customer 12345
Car booked for customer 12345
[👻 SIMULATED] This hotel is fully booked!
Hotel cancelled for customer 12345
Car cancelled for customer 12345
Flight cancelled for customer 12345
[restate][2025-05-29T15:10:01.741Z][BookingWorkflow/run][inv_144nN2pVmQaD6zGbwQFeMtadyzSIP4dzFf] WARN: Invocation completed with an error.
 TerminalError: [👻 SIMULATED] This hotel is fully booked!
... rest of trace ...
```

</details>
</details>

## Cron Jobs
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/cron/cron_service.ts)

Restate has no built-in functionality for cron jobs. 
But Restate's durable building blocks make it easy to implement a service that does this for us.
And uses the guarantees Restate gives to make sure tasks get executed reliably.

We use the following Restate features to implement the cron service:
- **Durable timers**: Restate allows the schedule tasks to run at a specific time in the future. Restate ensures execution.
- **Task control**: Restate allows starting and cancelling tasks.
- **K/V state**: We store the details of the cron jobs in Restate, so we can retrieve them later.

The cron service schedules tasks based on a cron expression, lets you cancel jobs and retrieve information about them.

For example, we create two cron jobs. One executes every minute, and the other one executes at midnight.
We then see the following in the UI:
<img src="img/cron_service_schedule.png" width="1200px" alt="Cron Service UI">

<img src="img/cron_state_ui.png" width="1200px" alt="Cron Job State UI">

Note that this implementation is fully resilient, but you might need to make some adjustments to make this fit your use case:
- Take into account time zones.
- Adjust how you want to handle tasks that fail until the next task gets scheduled. Right now, you would have concurrent executions of the same cron job (one retrying and the other starting up). 
- ...

<details>
<summary><strong>Running the example</strong></summary>

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the cron service and the task service:
   ```shell
   npx tsx watch ./src/cron/cron_service.ts
   ```
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

Send a request to create a cron job that runs every minute:

```shell
curl localhost:8080/CronJobInitiator/create --json '{ 
      "cronExpression": "* * * * *", 
      "service": "TaskService", 
      "method": "executeTask", 
      "payload": "Hello new minute!" 
  }'
```

Or create a cron job that runs at midnight:

```shell
curl localhost:8080/CronJobInitiator/create --json '{ 
      "cronExpression": "0 0 * * *", 
      "service": "TaskService", 
      "method": "executeTask", 
      "payload": "Hello midnight!" 
  }'
```

You can also use the cron service to execute handlers on Virtual Objects by specifying the Virtual Object key in the request.


You will get back a response with the job ID.

Using the job ID, you can then get information about the job:
```shell
curl localhost:8080/CronJob/<myJobId>/getInfo
```

Or cancel the job later:
```shell
curl localhost:8080/CronJob/<myJobId>/cancel
```

</details>

## Stateful Actors and State Machines
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/statefulactors/machine_operator.ts)

This example implements a State Machine with a Virtual Object.

* The object holds the state of the state machine and defines the methods
  to transition between the states.
* The object's unique id identifies the state machine. Many parallel state
  machines exist, but only state machine (object) exists per id.

* The _single-writer-per-key_ characteristic of virtual objects ensures
  that one state transition per state machine is in progress at a time.
  Additional transitions are enqueued for that object, while a transition
  for a machine is still in progress.
* The state machine behaves like a **virtual stateful actor**.

* The state machine transitions (object methods) themselves run with
  _durable execution_, so they recover with all partial progress
  and intermediate state.

What you get by this are _linearized interactions_ with your state machine,
avoiding accidental state corruption and concurrency issues.

<details>
<summary><strong>Running the example</strong></summary>

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `npx tsx watch ./src/statefulactors/machine_operator.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

Invoke the state machine transitions like
```shell
curl -X POST localhost:8080/machineOperator/my-machine/setUp
```

To illustrate the concurrency safety here, send multiple requests without waiting on
results and see how they play out sequentially per object (state machine).
Copy all the curl command lines below and paste them to the terminal together.
You will see both from the later results (in the terminal with the curl commands) and in
the log of the service that the requests queue per object key and safely execute
unaffected by crashes and recoveries.

```shell
(curl localhost:8080/machineOperator/a/setUp    -H 'content-type: application/json' -d '' &)
(curl localhost:8080/machineOperator/a/tearDown -H 'content-type: application/json' -d '' &)
(curl localhost:8080/machineOperator/b/setUp    -H 'content-type: application/json' -d '' &)
(curl localhost:8080/machineOperator/b/setUp    -H 'content-type: application/json' -d '' &)
(curl localhost:8080/machineOperator/b/tearDown -H 'content-type: application/json' -d '' &)
echo "executing..."
```

<details>
<summary><strong>View logs</strong></summary>

```shell
[restate] [machineOperator/tearDown][inv_1dceKvwtEc2n6bPpPFDDO6fD33NASbYjxD][2024-12-16T10:54:16.747Z] INFO:  Beginning transition of a to DOWN
[restate] [machineOperator/setUp][inv_174rq2A9bm3T0SlwFGpDxhm7YmCFe98hNf][2024-12-16T10:54:16.750Z] INFO:  Beginning transition of b to UP
[restate] [machineOperator/tearDown][inv_1dceKvwtEc2n6bPpPFDDO6fD33NASbYjxD][2024-12-16T10:54:21.757Z] INFO:  Done transitioning a to DOWN
[restate] [machineOperator/setUp][inv_174rq2A9bm3T0SlwFGpDxhm7YmCFe98hNf][2024-12-16T10:54:21.758Z] INFO:  Done transitioning b to UP
[restate] [machineOperator/tearDown][inv_174rq2A9bm3T57Pp4C02QnpcQoPPf2PdbX][2024-12-16T10:54:21.765Z] INFO:  Beginning transition of b to DOWN
A failure happened!
--- CRASHING THE PROCESS ---

> @restatedev/examples-patterns-state-machine@0.8.0 example
> RESTATE_DEBUG_LOGGING=OFF ts-node-dev --transpile-only src/machine_management.ts

[INFO] 11:54:23 ts-node-dev ver. 2.0.0 (using ts-node ver. 10.9.2, typescript ver. 5.7.2)
[restate] [2024-12-16T10:54:23.208Z] INFO:  Listening on 9080...
[restate] [2024-12-16T10:54:23.209Z] WARN:  Accepting requests without validating request signatures; handler access must be restricted
[restate] [machineOperator/tearDown][inv_174rq2A9bm3T57Pp4C02QnpcQoPPf2PdbX][2024-12-16T10:54:23.519Z] INFO:  Beginning transition of b to DOWN
[restate] [machineOperator/tearDown][inv_174rq2A9bm3T57Pp4C02QnpcQoPPf2PdbX][2024-12-16T10:54:28.529Z] INFO:  Done transitioning b to DOWN
```

</details>
</details>

## Payment State Machines
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/statemachinepayments/payment_service.ts)

This example shows how to build a reliable payment state machine.

The state machine ensures that payments are processed once, not duplicated,
can be revoked, and that concurrent payment requests and cancellations sort
out consistently.

The example illustrates the following aspects:

- Payment requests use a token to identify payments (stripe-style)
- Restate tracks the status of each payment request by token in internal state.
- A payment can be cancelled, which prevents it from succeeding later, or rolls it back, if
  it was already processed.
- Virtual Object concurrency ensures that requests and cancellations don't produce
  tricky race conditions.
- Expiry of tokens is handled through Restate's internal timers.

Despite the relatively few lines of code (no careful synchronization, retries, or other recovery logic),
this application maintains a high level of consistency in the presence of concurrent external requests
and failures.

<details>
<summary><strong>Running the example</strong></summary>

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `npx tsx watch ./src/statemachinepayments/payment_service.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

Make some requests:

- Make a payment. The 'my-payment-id' path segment is the unique id for the payment.
  For multiple payments, replace this with different IDs each time.
  ```shell
  curl -X POST localhost:8080/payments/my-payment-id/makePayment -H 'content-type: application/json' \
   -d '{  "accountId": "abc", "amount": 100 }'
  ```

- Cancel a payment

  ```shell
  curl -X POST localhost:8080/payments/my-payment-id/cancelPayment
  ```

Feel free to try and break the semantics with a storm of concurrent requests and restart processes
randomly at some points. Restate will ensure full consistency in all cases.

- Have a look at the state:
```shell
restate kv get payments my-payment-id
```

<details>
<summary>View logs</summary>

```
🤖 State:
―――――――――

Service  payments
Key      my-payment-id

KEY      VALUE
payment  {
"accountId": "abc",
"amountCents": 100
}
status   "CANCELLED"
```

</details>
</details>

## Scheduling Tasks
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/schedulingtasks/payment_reminders.ts)

An example of a handler that processes Stripe payment events.
On payment failure, it sends reminder emails to the customer. After a certain number of reminders, it escalates the invoice to the support team.
On payment success, it marks the invoice as paid.

Restate tracks the timer across failures, and triggers execution.

This example shows:
- **Durable webhook callback event processing**
- **Scheduling tasks and durable timers**: Sending reminder emails and escalating the invoice to the support team.
- **Joining and correlating events**: The handler correlates the payment events with the invoice ID.
- **Stateful service**: The handler keeps track of the number of reminders sent and the invoice status.

<details>
<summary><strong>Running the example</strong></summary>
To run the example, you might want to reduce the time between scheduled calls to see the scheduling in action.

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `npx tsx watch ./src/schedulingtasks/payment_reminders.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

Send some requests:

- Send a payment failure event to the handler:
  ```shell
  curl -X POST localhost:8080/PaymentTracker/invoice123/onPaymentFailure --json '{
        "type": "customer.subscription_created",
        "created": 1633025000,
        "data": {
        "id": "evt_1JH2Y4F2eZvKYlo2C8b9",
        "customer": "cus_J5K2Y4F2eZvKYlo2"
        }
    }'
  ```

- See how the reminder emails get sent
- Then send a payment success event to the handler:
  ```shell
  curl -X POST localhost:8080/PaymentTracker/invoice123/onPaymentSuccess --json '{
        "type": "customer.subscription_created",
        "created": 1633025000,
        "data": {
        "id": "evt_1JH2Y4F2eZvKYlo2C8b9",
        "customer": "cus_J5K2Y4F2eZvKYlo2"
        }
    }'
  ```

- Have a look at the state to see the invoice got paid:
```shell
restate kv get PaymentTracker invoice123
```

If we lower the time between scheduled calls, we can see the reminder emails being sent out and then the invoice getting escalated to the support team:
<details>
<summary>View logs</summary>

```
Sending reminder email for event: evt_1JH2Y4F2eZvKYlo2C8b9
Sending reminder email for event: evt_1JH2Y4F2eZvKYlo2C8b9
Sending reminder email for event: evt_1JH2Y4F2eZvKYlo2C8b9
Escalating to evt_1JH2Y4F2eZvKYlo2C8b9 invoice to support team
```

</details>
</details>

## Parallelizing work
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/parallelizework/fan_out_worker.ts)
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/read-guide.svg">](https://docs.restate.dev/guides/parallelizing-work)

This example shows how to use the Restate SDK to **execute a list of tasks in parallel and then gather their result**.
Also known as fan-out, fan-in.

The example implements a [worker service](src/parallelizework/fan_out_worker.ts), that takes a task as input.
It then splits the task into subtasks, executes them in parallel, and then gathers the results.

Restate guarantees and manages the execution of all the subtasks across failures.
You can run this on FaaS infrastructure, like AWS Lambda, and it will scale automatically.

## Transactional Event Processing
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/eventtransactions/user_feed.ts)

Processing events (from Kafka) to update various downstream systems.
- Durable side effects with retries and recovery of partial progress
- Events get sent to objects based on the Kafka key.
  For each key, Restate ensures that events are processed sequentially and in order.
  Slow events on other keys do not block processing (high fan-out, no head-of-line waiting).
- Ability to delay events when the downstream systems are busy, without blocking
  entire partitions.


<details>
<summary><strong>Running the example</strong></summary>

1. Start the Kafka broker via Docker Compose: `docker compose up -d`.
2. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) with the Kafka broker configuration in a separate shell: `restate-server --config-file restate.toml`
3. Start the service: `npx tsx watch ./src/eventtransactions/user_feed.ts`
4. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`
5. Let Restate subscribe to the Kafka topic `social-media-posts` and invoke `userFeed/processPost` on each message.
```shell
curl localhost:9070/subscriptions -H 'content-type: application/json' \
-d '{
    "source": "kafka://my-cluster/social-media-posts",
    "sink": "service://userFeed/processPost",
    "options": {"auto.offset.reset": "earliest"}
}'
```

Start a Kafka producer and send some messages to the `social-media-posts` topic:
```shell
docker exec -it broker kafka-console-producer --bootstrap-server broker:29092 --topic social-media-posts --property parse.key=true --property key.separator=:
```

Let's submit some posts for two different users:
```
userid1:{"content": "Hi! This is my first post!", "metadata": "public"}
userid2:{"content": "Hi! This is my first post!", "metadata": "public"}
userid1:{"content": "Hi! This is my second post!", "metadata": "public"}
```

Our Kafka broker only has a single partition so all these messages end up on the same partition.
You can see in the logs how events for different users are processed in parallel, but events for the same user are processed sequentially

<details>
<summary>View logs</summary>

```shell
Created post fd74fc81-2f8b-457a-aca3-2f297643ea54 for user userid1 with content: Hi! This is my first post!
Created post b0b6d057-0ec2-4a52-9942-81b675eae7c5 for user userid2 with content: Hi! This is my first post!
Content moderation for post fd74fc81-2f8b-457a-aca3-2f297643ea54 is still pending... Will check again in 5 seconds
Content moderation for post b0b6d057-0ec2-4a52-9942-81b675eae7c5 is done
Updating the user feed for user userid2 and post b0b6d057-0ec2-4a52-9942-81b675eae7c5
Content moderation for post fd74fc81-2f8b-457a-aca3-2f297643ea54 is still pending... Will check again in 5 seconds
Content moderation for post fd74fc81-2f8b-457a-aca3-2f297643ea54 is still pending... Will check again in 5 seconds
Content moderation for post fd74fc81-2f8b-457a-aca3-2f297643ea54 is done
Updating the user feed for user userid1 and post fd74fc81-2f8b-457a-aca3-2f297643ea54
Created post a05b134c-e7f6-4dcf-9cf2-e66faef49bde for user userid1 with content: Hi! This is my second post!
Content moderation for post a05b134c-e7f6-4dcf-9cf2-e66faef49bde is still pending... Will check again in 5 seconds
Content moderation for post a05b134c-e7f6-4dcf-9cf2-e66faef49bde is done
Updating the user feed for user userid1 and post a05b134c-e7f6-4dcf-9cf2-e66faef49bde
```

</details>

As you see, slow events do not block other slow events. Restate effectively created a queue per user ID.

The handler creates the social media post and waits for content moderation to finish.
If the moderation takes long, and there is an infrastructure crash, then Restate will trigger a retry.
The handler will fast-forward to where it was, will recover the post ID and will continue waiting for moderation to finish.

You can try it out by killing Restate or the service halfway through processing a post.

</details>

## Event Enrichment / Joins
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/eventenrichment/package_tracker.ts)

This example shows an example of:
- **Event enrichment** over different sources: RPC and Kafka
- **Stateful actors / Digital twins** updated over Kafka
- **Streaming join**
- Populating state from events and making it queryable via RPC handlers.

The example implements a package delivery tracking service.
Packages are registered via an RPC handler, and their location is updated via Kafka events.
The Package Tracker Virtual Object tracks the package details and its location history.


<details>
<summary><strong>Running the example</strong></summary>

1. Start the Kafka broker via Docker Compose: `docker compose up -d`.
2. Start Restate Server with the Kafka broker configuration in a separate shell: `restate-server --config-file restate.toml`
3. Start the service: `npx tsx watch ./src/eventenrichment/package_tracker.ts`
4. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`
5. Let Restate subscribe to the Kafka topic `package-location-updates` and invoke `package-tracker/updateLocation` on each message.
```shell
curl localhost:9070/subscriptions -H 'content-type: application/json' \
-d '{
    "source": "kafka://my-cluster/package-location-updates",
    "sink": "service://package-tracker/updateLocation",
    "options": {"auto.offset.reset": "earliest"}
}'
```

1. Register a new package via the RPC handler:
```shell
curl localhost:8080/package-tracker/package123/registerPackage \
  -H 'content-type: application/json' -d '{"finalDestination": "Bridge 6, Amsterdam"}'
```

2. Start a Kafka producer and publish some messages to update the location of the package on the `package-location-updates` topic:
```shell
docker exec -it broker kafka-console-producer --bootstrap-server broker:29092 --topic package-location-updates --property parse.key=true --property key.separator=:
```
Send messages like
```
package123:{"timestamp": "2024-10-10 13:00", "location": "Pinetree Road 5, Paris"}
package123:{"timestamp": "2024-10-10 14:00", "location": "Mountain Road 155, Brussels"}
```

3. Query the package location via the RPC handler:
```shell
curl localhost:8080/package-tracker/package123/getPackageInfo
```
or via the CLI: `restate kv get package-tracker package123`

You can see how the state was enriched by the initial RPC event and the subsequent Kafka events.

<details>
<summary>View logs</summary>

```
🤖 State:
―――――――――

 Service  package-tracker
 Key      package123

 KEY           VALUE
 package-info  {
                  "finalDestination": "Bridge 6, Amsterdam",
                  "locations": [
                    {
                      "location": "Pinetree Road 5, Paris",
                      "timestamp": "2024-10-10 13:00"
                    },
                    {
                      "location": "Mountain Road 155, Brussels",
                      "timestamp": "2024-10-10 14:00"
                    }
                  ]
                }
```

</details>
</details>

## Durable Promises as a Service
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/promiseasaservice)

This example shows how you can use Restate to build Promises/Futures as a service, that can be exposed to external clients and are durable across processes and failures.

They can be used to build simple and reliable **callbacks**,
**signal** and **communicate between systems**, or to decouple sender/receiver.

* A promise is uniquely identified by an _id_
* An arbitrary number of _awaiters_ (listeners) across different
  processes can await the promise.
* That promise can be _resolved/rejected_ once. If multiple attempts
  to resolve or reject are made, only the first will take effect. The
  resolution is _idempotent_.

The promises are a simple but expressive way to signal across distributed
processes:

* Their idempotency on resolution guarantees a stable value
* Listeners can await the value for a long time, and retrieve the value
  again after a failure/restart (await again, get the same value).
* The result is durable once set. Completer and listeners do not need to
  be alive at the same time.
* It does not matter whether listener or completer comes first.


<details>
<summary><strong>Using and running the example</strong></summary>

**Using promises from TypeScript**

```typescript
const promiseId = "my-durable-promise-id";
const restateUri = "restate:8080";

// get a reference to a durable promise
const durablePromise = dp.durablePromise<string>(restateUri, promiseId);

// check the promise without blocking
const peeked = await durablePromise.peek();

// awaiting the result
const resultProm = await durablePromise.get();

// completing the promise. if we are the first to complete, the actual result
// will be our completion value
const actualResult = await durablePromise.resolve("This promise will notify everyone");

// Likewise for rejections
const actualResult2 = await durablePromise.reject("Oh dear, rejected");
```

**Using promises via HTTP/curl**

* **peek:** `curl localhost:8080/durablePromiseServer/peek -H 'content-type: application/json' -d '{ "request": { "promiseName": "prom-1" } }'`

* **await:** `curl localhost:8080/durablePromiseServer/await -H 'content-type: application/json' -d '{ "request": { "promiseName": "prom-1" } }'`

* **resolve:** `curl localhost:8080/durablePromiseServer/resolve -H 'content-type: application/json' -d '{ "request": { "promiseName": "prom-1", "value": { "name": "Barack", "email": "b@whitehouse.gov" } } }'`

* **reject:** `curl localhost:8080/durablePromiseServer/reject -H 'content-type: application/json' -d '{ "request": { "promiseName": "prom-1", "errorMessage": "help!" } }'`


### Implementation

The Durable Promises are a simple application implemented on top of Restate, making
use of Restate's Virtual Objects. You can use this simple implementation and add it
to your application or infra as a self-contained piece.

### Running the example

* Start Restate in one shell: `restate-server`
* Start the Durable Promises implementation in another shell: `npx tsx watch ./src/promiseasaservice/dp/runner.ts 9080`
* Register Durable Promises service: `restate -y deployment register "localhost:9080" --force`

_Note: the '--force' flag here is to circumvent all checks relating to graceful upgrades,
because this here is only an example/playground, not a production setup._

You can now await and resolve promises from different processes at different times.
With via simple HTTP calls (see above) or the TypeScript API.

You can start the bundled examples via
- `npx tsx ./src/promiseasaservice/1_example.ts`
- `npx tsx ./src/promiseasaservice/2_example_process.ts`
- `npx tsx ./src/promiseasaservice/3_example_parallel_processes.ts`
- `npx tsx ./src/promiseasaservice/4_example.ts`,
optionally passing `[promise-id] [restateUri]` as parameters.

</details>

## Priority queue
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/priorityqueue)

An example of implementing your own priority queue using Restate state and awakeables.


<details>
<summary><strong>Running the example</strong></summary>

Run the example with `npx tsx watch ./src/priorityqueue/app.ts`.

You can simulate adding work to the queue like this:
```shell
# add a single entry
curl localhost:8080/myService/expensiveMethod/send -H 'content-type:application/json' -d '{"left": 1, "right": 2, "priority": 1}'
# add lots
for i in $(seq 1 30); do curl localhost:8080/myService/expensiveMethod/send -H 'content-type:application/json' -d '{"left": 1, "right": 2, "priority": 2}'; done
```

As you do so, you can observe the logs; in flight requests will increase up to 10, beyond which items will be enqueued.

You can write your own queue item selection logic in `selectAndPopItem`; doing so is outside the scope of this example.

</details>

## Rate limiting
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/ratelimit)

An example of implementing a token bucket rate limiter using Restate state and the sleep primitive.


<details>
<summary><strong>Running the example</strong></summary>

Run the example with `npx tsx watch ./src/ratelimit/app.ts`.

Set up the limiter named `myService-expensiveMethod` with a rate limit of 1 per second:
```shell
curl localhost:8080/limiter/myService-expensiveMethod/setRate -H 'content-type:application/json' -d '{"newLimit": 1, "newBurst": 1}'
```

You can send requests that are subject to the limiter like this:
```shell
# send one request
curl localhost:8080/myService/expensiveMethod
# send lots
for i in $(seq 1 30); do curl localhost:8080/myService/expensiveMethod && echo "request completed"; done
```

You should observe that only one request is processed per second. You can then try changing the limit or the burst
and sending more requests.

</details>
