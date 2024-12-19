# Java Patterns and Use Cases

Common tasks and patterns implemented with Restate:

| Category         | Use case / Name                          |                                                                             |                                                                                                | Difficulty  | Description                                                                                                 |
|------------------|------------------------------------------|-----------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|-------------|-------------------------------------------------------------------------------------------------------------|
| Microservices    | Durable RPC | [code](src/main/java/my/example/durablerpc/MyClient.java)                   | [README](#microservices-durable-rpc)                                                           | Basic        | Restate persists requests and makes sure they execute exactly-once.                                         |
| Microservices    | Sagas | [code](src/main/java/my/example/sagas/BookingWorkflow.java)                 | [README](#microservices-sagas)                                                                 | Basic        | Preserve consistency by tracking undo actions and running them when code fails halfway through.             |
| Microservices    | Stateful Actors | [code](src/main/java/my/example/statefulactors/MachineOperator.java)        | [README](#microservices-stateful-actors)                                                       | Basic                          | State machine with a set of transitions, built as a Restate Virtual Object for automatic state persistence. |
| Microservices    | Payment state machines | [code](src/main/java/my/example/statemachinepayments/PaymentProcessor.java) | [README](#microservices-payment-state-machine)                                                 | Advanced                       | State machine example that tracks a payment process, ensuring consistent processing and cancellations.      |
| Async tasks      | (Delayed) Task Queue | [code](src/main/java/my/example/queue/TaskSubmitter.java)                   | [README](#async-tasks-delayed-tasks-queue)                                                     | Basic                          | Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once.          |
| Async tasks      | Parallelizing work | [code](src/main/java/my/example/parallelizework/FanOutWorker.java)          | [README](#async-tasks-parallelizing-work)                                                      | Intermediate                   | Execute a list of tasks in parallel and then gather their result.                                           |
| Async tasks      | Slow async data upload | [code](src/main/java/my/example/dataupload/UploadClient.java)               | [README](#async-tasks-async-data-upload)                                                       | Intermediate                   | Kick of a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long.    |
| Async tasks      | Payments: async signals | [code](src/main/java/my/example/signalspayments/PaymentService.java)        | [README](#async-tasks-payment-signals---combining-sync-and-async-webhook-responses-from-stripe) | Advanced                       | Handling async payment callbacks for slow payments, with Stripe.                                            |
| Event processing | Transactional handlers | [code](src/main/java/my/example/eventtransactions/UserFeed.java)            | [README](#event-processing-transactional-handlers-with-durable-side-effects-and-timers)        | Basic                          | Processing events (from Kafka) to update various downstream systems in a transactional way.                 |
| Event processing | Enriching streams | [code](src/main/java/my/example/eventenrichment/PackageTracker.java)        | [README](#event-processing-event-enrichment)                                                   | Basic                          | Stateful functions/actors connected to Kafka and callable over RPC.                                         |

## Microservices: Durable RPC

This example shows an example of:
- **Durable RPC**: once a request has reached Restate, it is guaranteed to be processed
- **Exactly-once processing**: Ensure that duplicate requests are not processed multiple times via idempotency keys

The example shows how you can programmatically submit a requests to a Restate service.
Every request gets processed durably, and deduplicated based on the idempotency key.

The example shows a [client](src/main/java/my/example/durablerpc/MyClient.java) that receives product reservation requests and forwards them to the product service.
The [Product service](src/main/java/my/example/durablerpc/ProductService.java) is a Restate service that durably processes the reservation requests and deduplicates them.
Each product can be reserved only once.

## Microservices: Sagas

An example of a trip reservation workflow, using the saga pattern to undo previous steps in case of an error.

Durable Execution's guarantee to run code to the end in the presence of failures, and to deterministically recover previous steps from the journal, makes sagas easy.
Every step pushes a compensation action (an undo operation) to a stack. In the case of an error, those operations are run.

The main requirement is that steps are implemented as journaled operations, like `ctx.run()` or RPC/messaging.

### Adding compensations
The example shows two ways you can implement the compensation, depending on the characteristics of the API/system you interact with.

The flight and car reservations work in a two-phase commit way, where you first create a reservation, get a reservation ID back, and then confirm or cancel the reservation with its ID.
In this case, you need to add the compensation to the list after creating the reservation, because you need the reservation ID to cancel it.
If the failure happens while making the reservation, you can be sure that it never takes effect, because you didn't confirm it.

The payment on the other hand uses a client generated idempotency key.
The payment goes through in one shot (single API call).
If we receive an error, we might not be sure if this occurred before or after the payment took effect.
Therefore, we need to add the compensation to the list before the payment is made.
If a failure happens during the payment, the compensation will run.
The downstream API then uses the idempotency key to check if the payment went through, and whether it needs to be refunded.

Note that the compensating action needs to be idempotent.

### Running this example
1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `./gradlew -PmainClass=my.example.sagas.BookingWorkflow run`
3. Register the services: `restate -y deployments register localhost:9080`

### Demo scenario

Have a look at the logs to see how the compensations run in case of a terminal error.

Start the workflow:
```shell
curl -X POST localhost:8080/BookingWorkflow/trip12883/run -H 'content-type: application/json' -d '{
  "flights": {
    "flightId": "12345",
    "passengerName": "John Doe"
  },
  "car": {
    "pickupLocation": "Airport",
    "rentalDate": "2024-12-16"
  },
  "paymentInfo": {
    "cardNumber": "4111111111111111",
    "amount": 1500
  }
}'
```

Have a look at the logs to see the cancellations of the flight and car booking in case of a terminal error:
```shell
2024-12-18 11:35:48 INFO  [BookingWorkflow/run][inv_12ogPnVefk1c3clc9wNhEa4pMxxRh9IRyx] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-18 11:35:49 INFO  [Flights/reserve][inv_1ccelXW8IxuW6QpLWQu9ykt5aMAqRTl7pL] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-18 11:35:49 INFO  [Flights/reserve][inv_1ccelXW8IxuW6QpLWQu9ykt5aMAqRTl7pL] dev.restate.patterns.activities.Flights - Flight reservation created with id: 35ab7c68-6f32-48f6-adb9-a2a74076f4df
2024-12-18 11:35:49 INFO  [Flights/reserve][inv_1ccelXW8IxuW6QpLWQu9ykt5aMAqRTl7pL] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-18 11:35:49 INFO  [CarRentals/reserve][inv_13cgaqr4XecK2ztj72BfVPuscdL1SJwMCZ] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-18 11:35:49 INFO  [CarRentals/reserve][inv_13cgaqr4XecK2ztj72BfVPuscdL1SJwMCZ] dev.restate.patterns.activities.CarRentals - Car rental reservation created with id: c103022e-9dda-4a34-a6ef-0c95d2911b2c
2024-12-18 11:35:49 INFO  [CarRentals/reserve][inv_13cgaqr4XecK2ztj72BfVPuscdL1SJwMCZ] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-18 11:35:49 ERROR [BookingWorkflow/run][inv_12ogPnVefk1c3clc9wNhEa4pMxxRh9IRyx] dev.restate.patterns.clients.PaymentClient - This payment should never be accepted! Aborting booking.
2024-12-18 11:35:49 INFO  [Flights/cancel][inv_19STR0U1v5Xo5W2UsYS3rhZEI02VGDVJM5] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-18 11:35:49 INFO  [Flights/cancel][inv_19STR0U1v5Xo5W2UsYS3rhZEI02VGDVJM5] dev.restate.patterns.activities.Flights - Flight reservation cancelled with id: 35ab7c68-6f32-48f6-adb9-a2a74076f4df
2024-12-18 11:35:49 INFO  [Flights/cancel][inv_19STR0U1v5Xo5W2UsYS3rhZEI02VGDVJM5] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-18 11:35:49 INFO  [CarRentals/cancel][inv_14PS98BWOeNn1zw3yn2RqJ0wSp7V5sEJMd] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-18 11:35:49 INFO  [CarRentals/cancel][inv_14PS98BWOeNn1zw3yn2RqJ0wSp7V5sEJMd] dev.restate.patterns.activities.CarRentals - Car rental reservation cancelled with id: c103022e-9dda-4a34-a6ef-0c95d2911b2c
2024-12-18 11:35:49 INFO  [CarRentals/cancel][inv_14PS98BWOeNn1zw3yn2RqJ0wSp7V5sEJMd] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-18 11:35:49 INFO  [BookingWorkflow/run][inv_12ogPnVefk1c3clc9wNhEa4pMxxRh9IRyx] dev.restate.patterns.clients.PaymentClient - Refunding payment with id: 1a640cda-bd5f-9751-b6b9-274817549b58
2024-12-18 11:35:49 WARN  [BookingWorkflow/run][inv_12ogPnVefk1c3clc9wNhEa4pMxxRh9IRyx] dev.restate.sdk.core.ResolvedEndpointHandlerImpl - Error when processing the invocation
dev.restate.sdk.common.TerminalException: Payment could not be accepted!
... rest of trace ...
```

## Microservices: Stateful Actors

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

### Running the example
1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `./gradlew -PmainClass=my.example.statefulactors.MachineOperator run`
3. Register the services: `restate -y deployments register localhost:9080`

### Demo scenario

Invoke the state machine transitions like
```shell
curl -X POST localhost:8080/MachineOperator/my-machine/setUp
```

To illustrate the concurrency safety here, send multiple requests without waiting on
results and see how they play out sequentially per object (state machine).
Copy all the curl command lines below and paste them to the terminal together.
You will see both from the later results (in the terminal with the curl commands) and in
the log of the service that the requests queue per object key and safely execute
unaffected by crashes and recoveries.

```shell
(curl -X POST localhost:8080/MachineOperator/a/setUp &)
(curl -X POST localhost:8080/MachineOperator/a/tearDown &)
(curl -X POST localhost:8080/MachineOperator/b/setUp &)
(curl -X POST localhost:8080/MachineOperator/b/setUp &)
(curl -X POST localhost:8080/MachineOperator/b/tearDown &)
echo "executing..."
```

For example:
```shell
2024-12-19 09:12:22 INFO  [MachineOperator/setUp][inv_1dceKvwtEc2n5doRPWFKzl2mKeGSpwxxO9] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-19 09:12:22 INFO  [MachineOperator/setUp][inv_174rq2A9bm3T30Ad4teHAPrb0QzkrcjlGV] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-19 09:12:22 INFO  [MachineOperator/setUp][inv_1dceKvwtEc2n5doRPWFKzl2mKeGSpwxxO9] my.example.statefulactors.utils.MachineOperations - a beginning transition to UP
2024-12-19 09:12:22 INFO  [MachineOperator/setUp][inv_174rq2A9bm3T30Ad4teHAPrb0QzkrcjlGV] my.example.statefulactors.utils.MachineOperations - b beginning transition to UP
2024-12-19 09:12:27 INFO  [MachineOperator/setUp][inv_174rq2A9bm3T30Ad4teHAPrb0QzkrcjlGV] my.example.statefulactors.utils.MachineOperations - b is now running
2024-12-19 09:12:27 INFO  [MachineOperator/setUp][inv_1dceKvwtEc2n5doRPWFKzl2mKeGSpwxxO9] my.example.statefulactors.utils.MachineOperations - a is now running
2024-12-19 09:12:27 INFO  [MachineOperator/setUp][inv_1dceKvwtEc2n5doRPWFKzl2mKeGSpwxxO9] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-19 09:12:27 INFO  [MachineOperator/setUp][inv_174rq2A9bm3T30Ad4teHAPrb0QzkrcjlGV] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-19 09:12:27 INFO  [MachineOperator/tearDown][inv_1dceKvwtEc2n2EW92WkrNSTF5E4UMjYAJX] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-19 09:12:27 INFO  [MachineOperator/setUp][inv_174rq2A9bm3T0AjO2JedeGnkGYK7Uvtnod] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-19 09:12:27 INFO  [MachineOperator/tearDown][inv_1dceKvwtEc2n2EW92WkrNSTF5E4UMjYAJX] my.example.statefulactors.utils.MachineOperations - a beginning transition to down
2024-12-19 09:12:27 INFO  [MachineOperator/setUp][inv_174rq2A9bm3T0AjO2JedeGnkGYK7Uvtnod] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-19 09:12:27 INFO  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-19 09:12:27 INFO  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] my.example.statefulactors.utils.MachineOperations - b beginning transition to down
2024-12-19 09:12:27 ERROR [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] my.example.statefulactors.utils.MachineOperations - A failure happened!
2024-12-19 09:12:27 WARN  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] dev.restate.sdk.core.ResolvedEndpointHandlerImpl - Error when processing the invocation
java.lang.RuntimeException: A failure happened!
...rest of trace...
2024-12-19 09:12:27 INFO  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-19 09:12:27 INFO  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] my.example.statefulactors.utils.MachineOperations - b beginning transition to down
2024-12-19 09:12:27 ERROR [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] my.example.statefulactors.utils.MachineOperations - A failure happened!
2024-12-19 09:12:27 WARN  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] dev.restate.sdk.core.ResolvedEndpointHandlerImpl - Error when processing the invocation
java.lang.RuntimeException: A failure happened!
...rest of trace...
2024-12-19 09:12:27 INFO  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-19 09:12:27 INFO  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] my.example.statefulactors.utils.MachineOperations - b beginning transition to down
2024-12-19 09:12:27 ERROR [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] my.example.statefulactors.utils.MachineOperations - A failure happened!
2024-12-19 09:12:27 WARN  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] dev.restate.sdk.core.ResolvedEndpointHandlerImpl - Error when processing the invocation
java.lang.RuntimeException: A failure happened!
...rest of trace...
2024-12-19 09:12:27 INFO  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-19 09:12:27 INFO  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] my.example.statefulactors.utils.MachineOperations - b beginning transition to down
2024-12-19 09:12:32 INFO  [MachineOperator/tearDown][inv_1dceKvwtEc2n2EW92WkrNSTF5E4UMjYAJX] my.example.statefulactors.utils.MachineOperations - a is now down
2024-12-19 09:12:32 INFO  [MachineOperator/tearDown][inv_1dceKvwtEc2n2EW92WkrNSTF5E4UMjYAJX] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-19 09:12:32 INFO  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] my.example.statefulactors.utils.MachineOperations - b is now down
2024-12-19 09:12:32 INFO  [MachineOperator/tearDown][inv_174rq2A9bm3T2s4ghDhTXRkFKH3ZLp8Jtn] dev.restate.sdk.core.InvocationStateMachine - End invocation
```

## Microservices: Payment State Machine

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

### Running this example
1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `./gradlew -PmainClass=my.example.statemachinepayments.AppMain run`
3. Register the services: `restate -y deployments register localhost:9080`

### Demo scenario
Send some requests:

- Make a payment
  ```shell
  curl -X POST localhost:8080/PaymentProcessor/some-string-id/makePayment -H 'content-type: application/json' \
   -d '{  "accountId": "abc", "amountCents": 100 }'
  ```

- Cancel a payment. The 'key' parameter is the idempotency token, there is no further request data.

  ```shell
  curl -X POST localhost:8080/PaymentProcessor/some-string-id/cancelPayment
  ```

- Have a look at the state:
```shell
restate kv get PaymentProcessor some-string-id
```
```
🤖 State:
―――――――――
                           
 Service  PaymentProcessor 
 Key      some-string-id   

 KEY      VALUE                 
 payment  {                     
            "accountId": "abc", 
            "amountCents": 100  
          }                     
 status   "CANCELLED"
```

## Async Tasks: (Delayed) Tasks Queue

Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once.

Files to look at:
- [Task Submitter](src/main/java/my/example/queue/TaskSubmitter.java): schedules tasks via send requests with and idempotency key.
    - The **send requests** put the tasks in Restate's queue. The task submitter does not wait for the task response.
    - The **idempotency key** in the header is used by Restate to deduplicate requests.
    - If a delay is set, the task will be executed later and Restate will track the timer durably, like a **delayed task queue**.
- [Async Task Worker](src/main/java/my/example/queue/AsyncTaskWorker.java): gets invoked by Restate for each task in the queue.

## Async Tasks: Parallelizing work

This example shows how to use the Restate SDK to **execute a list of tasks in parallel and then gather their result**.
Also known as fan-out, fan-in.

The example implements a [worker service](src/main/java/my/example/parallelizework/FanOutWorker.java), that takes a task as input.
It then splits the task into subtasks, executes them in parallel, and then gathers the results.

Restate guarantees and manages the execution of all the subtasks across failures.
You can run this on FaaS infrastructure, like AWS Lambda, and it will scale automatically.

## Async Tasks: Async Data Upload

This example shows how to use the Restate SDK to **kick of a synchronous task and turn it into an asynchronous one if it takes too long**.

The example implements a [data upload service](src/main/java/my/example/dataupload/DataUploadService.java), that creates a bucket, uploads data to it, and then returns the URL.

The [upload client](src/main/java/my/example/dataupload/UploadClient.java) does a synchronous request to upload the file, and the server will respond with the URL.

If the upload takes too long, however, the client asks the upload service to send the URL later in an email.

### Running the examples
1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `./gradlew -PmainClass=my.example.dataupload.DataUploadService run`
3. Register the services: `restate -y deployments register localhost:9080`

### Demo scenario

Run the upload client with a userId: `./gradlew -PmainClass=my.example.dataupload.UploadClient run --args="someone21"`

This will submit an upload workflow to the data upload service.
The workflow will run only once per ID, so you need to provide a new ID for each run.

Have a look at the logs to see how the execution switches from synchronously waiting to the response to requesting an email:

#### Fast upload

Client logs:
```
2024-12-18 15:02:34 INFO   my.example.UploadClient - Uploading data for user someone212
2024-12-18 15:02:36 INFO   my.example.UploadClient - Fast upload... URL was https://s3-eu-central-1.amazonaws.com/257587941/
```
Workflow logs:
```
2024-12-18 15:02:34 INFO  [DataUploadService/run][inv_17cZwACLnO7f5m1BjN7SKoQpuyycCmWwnv] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-18 15:02:34 INFO  [DataUploadService/run][inv_17cZwACLnO7f5m1BjN7SKoQpuyycCmWwnv] my.example.utils.DataOperations - Creating bucket with URL https://s3-eu-central-1.amazonaws.com/257587941/
2024-12-18 15:02:34 INFO  [DataUploadService/run][inv_17cZwACLnO7f5m1BjN7SKoQpuyycCmWwnv] my.example.utils.DataOperations - Uploading data to target https://s3-eu-central-1.amazonaws.com/257587941/. ETA: 1500 ms
2024-12-18 15:02:36 INFO  [DataUploadService/run][inv_17cZwACLnO7f5m1BjN7SKoQpuyycCmWwnv] dev.restate.sdk.core.InvocationStateMachine - End invocation
```

#### Slow upload

Client logs:
```
2024-12-18 15:02:41 INFO   my.example.UploadClient - Uploading data for user someone2122
2024-12-18 15:02:46 INFO   my.example.UploadClient - Slow upload... Mail the link later
```

Workflow logs:
```
2024-12-18 15:02:41 INFO  [DataUploadService/run][inv_1koakM2GXxcN2Co3aM3pSrQJokiqnyR7MJ] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-18 15:02:41 INFO  [DataUploadService/run][inv_1koakM2GXxcN2Co3aM3pSrQJokiqnyR7MJ] my.example.utils.DataOperations - Creating bucket with URL https://s3-eu-central-1.amazonaws.com/493004051/
2024-12-18 15:02:41 INFO  [DataUploadService/run][inv_1koakM2GXxcN2Co3aM3pSrQJokiqnyR7MJ] my.example.utils.DataOperations - Uploading data to target https://s3-eu-central-1.amazonaws.com/493004051/. ETA: 10000 ms
2024-12-18 15:02:46 INFO  [DataUploadService/resultAsEmail][inv_1koakM2GXxcN7veCWCBDo77G0P2BIX7KFz] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-18 15:02:51 INFO  [DataUploadService/run][inv_1koakM2GXxcN2Co3aM3pSrQJokiqnyR7MJ] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-18 15:02:51 INFO  [DataUploadService/resultAsEmail][inv_1koakM2GXxcN7veCWCBDo77G0P2BIX7KFz] my.example.utils.EmailClient - Sending email to https://s3-eu-central-1.amazonaws.com/493004051/ with url someone2122@example.com
2024-12-18 15:02:51 INFO  [DataUploadService/resultAsEmail][inv_1koakM2GXxcN7veCWCBDo77G0P2BIX7KFz] dev.restate.sdk.core.InvocationStateMachine - End invocation
```
You see the call to `resultAsEmail` after the upload took too long, and the sending of the email.

## Async Tasks: Payment Signals - Combining Sync and Async (Webhook) Responses from Stripe

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

### Running the Example

This example works end-to-end with Stripe. You need a Stripe account to run it.
If you want to run everything locally, you also need a tool like _ngrok_ to forward
webhooks to your local machine.

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `./gradlew -PmainClass=my.example.signalspayments.PaymentService run`
3. Register the services: `restate -y deployments register localhost:9080`

4. Create a free Stripe test account. This requires no verification, but you can only work
   with test data, not make real payments. Good enough for this example.

5. In the Stripe UI, go to "Developers" -> "API Keys" and copy the _secret key_ (`sk_test_...`).
   Add it to the [StripeUtils.java](src/main/java/my/example/signalspayment/utils/StripeUtils.java) file. Because this is a dev-only
   API key, it supports only test data, so it isn't super sensitive.

6. Run launch _ngrok_: Get a free account and download the binary, or launch a docker container.
   Make it forward HTTP calls to local port `8080`
    - `NGROK_AUTHTOKEN=<your token> ngrok http 8080`
    - or `docker run --rm -it -e NGROK_AUTHTOKEN=<your token> --network host ngrok/ngrok http 8080` (on Linux command).
      Copy the public URL that ngrok shows you: `https://<some random numbers>.ngrok-free.app`

7. Go to the Stripe UI and create a webhook. Select all _"Payment Intent"_ event types. Put the ngrok
   public URL + `/PaymentService/processWebhook` as the webhook URL (you need to update this whenever you stop/start ngrok).
   Example: `https://<some random numbers>.ngrok-free.app/PaymentService/processWebhooks`

8. Put the webhook secret (`whsec_...`) to the [StripeUtils.java](src/main/java/my/example/signalspayment/StripeUtils.java) file.

Use as test data `pm_card_visa` for a successful payment and `pm_card_visa_chargeDeclined` for a declined payment.
Because the test data rarely triggers an async response, this example's tools can mimic that
if you add `"delayedStatus": true` to the request.

```shell
curl localhost:8080/PaymentService/processPayment -H 'content-type: application/json' -d '{
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

## Event Processing: Transactional Handlers with Durable Side Effects and Timers

Processing events (from Kafka) to update various downstream systems.
- Durable side effects with retries and recovery of partial progress
- Events get sent to objects based on the Kafka key.
  For each key, Restate ensures that events are processed sequentially and in order.
  Slow events on other keys do not block processing (high fan-out, no head-of-line waiting).
- Ability to delay events when the downstream systems are busy, without blocking
  entire partitions.


### Running the example

1. Start the Kafka broker via Docker Compose: `docker compose up -d`.

2. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) with the Kafka broker configuration in a separate shell: `restate-server --config-file restate.toml`

3. Start the service: `./gradlew -PmainClass=my.example.eventtransactions.UserFeed run`

4. Register the example at Restate server by calling `restate -y deployment register localhost:9080`.

5. Let Restate subscribe to the Kafka topic `social-media-posts` and invoke `UserFeed/processPost` on each message.
```shell
curl localhost:9070/subscriptions -H 'content-type: application/json' \
-d '{
    "source": "kafka://my-cluster/social-media-posts",
    "sink": "service://UserFeed/processPost",
    "options": {"auto.offset.reset": "earliest"}
}'
```

### Demo scenario

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
You can see in the logs how events for different users are processed in parallel, but events for the same user are processed sequentially:

```shell
2024-12-17 18:07:43 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Creating post 300dbd34-eae8-4875-8a71-c18b14e2aed7 for user userid1
2024-12-17 18:07:43 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Content moderation for post 300dbd34-eae8-4875-8a71-c18b14e2aed7 is still pending... Will check again in 5 seconds
2024-12-17 18:07:46 INFO  [UserFeed/processPost][inv_1eZjTF0DbaEl3UzViEbqNPu6FZK4Y8KBAB] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-17 18:07:46 INFO  [UserFeed/processPost][inv_1eZjTF0DbaEl3UzViEbqNPu6FZK4Y8KBAB] my.example.utils.Stubs - Creating post 011443bb-a47d-43a0-8df4-d2c4ea50b3b8 for user userid2
2024-12-17 18:07:46 INFO  [UserFeed/processPost][inv_1eZjTF0DbaEl3UzViEbqNPu6FZK4Y8KBAB] my.example.utils.Stubs - Content moderation for post 011443bb-a47d-43a0-8df4-d2c4ea50b3b8 is still pending... Will check again in 5 seconds
2024-12-17 18:07:48 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Content moderation for post 300dbd34-eae8-4875-8a71-c18b14e2aed7 is still pending... Will check again in 5 seconds
2024-12-17 18:07:56 INFO  [UserFeed/processPost][inv_1eZjTF0DbaEl3UzViEbqNPu6FZK4Y8KBAB] my.example.utils.Stubs - Content moderation for post 011443bb-a47d-43a0-8df4-d2c4ea50b3b8 is done
2024-12-17 18:07:56 INFO  [UserFeed/processPost][inv_1eZjTF0DbaEl3UzViEbqNPu6FZK4Y8KBAB] my.example.utils.Stubs - Updating user feed for user userid2 with post 011443bb-a47d-43a0-8df4-d2c4ea50b3b8
2024-12-17 18:07:56 INFO  [UserFeed/processPost][inv_1eZjTF0DbaEl3UzViEbqNPu6FZK4Y8KBAB] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-17 18:07:58 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Content moderation for post 300dbd34-eae8-4875-8a71-c18b14e2aed7 is still pending... Will check again in 5 seconds
2024-12-17 18:09:03 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Content moderation for post 300dbd34-eae8-4875-8a71-c18b14e2aed7 is still pending... Will check again in 5 seconds
2024-12-17 18:09:08 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Content moderation for post 300dbd34-eae8-4875-8a71-c18b14e2aed7 is done
2024-12-17 18:09:08 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Updating user feed for user userid1 with post 300dbd34-eae8-4875-8a71-c18b14e2aed7
2024-12-17 18:09:08 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-17 18:09:08 INFO  [UserFeed/processPost][inv_13puWeoWJykN0lJ761afYGoczigaKJDzWh] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-17 18:09:08 INFO  [UserFeed/processPost][inv_13puWeoWJykN0lJ761afYGoczigaKJDzWh] my.example.utils.Stubs - Creating post 738f0f12-8191-4702-bf49-59e1604ee799 for user userid1
2024-12-17 18:09:08 INFO  [UserFeed/processPost][inv_13puWeoWJykN0lJ761afYGoczigaKJDzWh] my.example.utils.Stubs - Content moderation for post 738f0f12-8191-4702-bf49-59e1604ee799 is still pending... Will check again in 5 seconds
2024-12-17 18:09:48 INFO  [UserFeed/processPost][inv_13puWeoWJykN0lJ761afYGoczigaKJDzWh] my.example.utils.Stubs - Content moderation for post 738f0f12-8191-4702-bf49-59e1604ee799 is done
2024-12-17 18:09:48 INFO  [UserFeed/processPost][inv_13puWeoWJykN0lJ761afYGoczigaKJDzWh] my.example.utils.Stubs - Updating user feed for user userid1 with post 738f0f12-8191-4702-bf49-59e1604ee799
2024-12-17 18:09:48 INFO  [UserFeed/processPost][inv_13puWeoWJykN0lJ761afYGoczigaKJDzWh] dev.restate.sdk.core.InvocationStateMachine - End invocation
```

As you see, slow events do not block other slow events.
Restate effectively created a queue per user ID.

The handler creates the social media post and waits for content moderation to finish.
If the moderation takes long, and there is an infrastructure crash, then Restate will trigger a retry.
The handler will fast-forward to where it was, will recover the post ID and will continue waiting for moderation to finish.

You can try it out by killing Restate or the service halfway through processing a post.

## Event Processing: Event Enrichment

This example shows an example of:
- **Event enrichment** over different sources: RPC and Kafka
- **Stateful actors / Digital twins** updated over Kafka
- **Streaming join**
- Populating state from events and making it queryable via RPC handlers.

The example implements a package delivery tracking service.
Packages are registered via an RPC handler, and their location is updated via Kafka events.
The Package Tracker Virtual Object tracks the package details and its location history.

### Running the example

1. Start the Kafka broker via Docker Compose: `docker compose up -d`.

2. Start Restate Server with the Kafka broker configuration in a separate shell: `restate-server --config-file restate.toml`

3. Start the service: `./gradlew -PmainClass=my.example.eventenrichment.PackageTracker run`

4. Register the example at Restate server by calling
   `restate -y deployment register localhost:9080`.

5. Let Restate subscribe to the Kafka topic `package-location-updates` and invoke `PackageTracker/updateLocation` on each message.
```shell
curl localhost:9070/subscriptions -H 'content-type: application/json' \
-d '{
    "source": "kafka://my-cluster/package-location-updates",
    "sink": "service://PackageTracker/updateLocation",
    "options": {"auto.offset.reset": "earliest"}
}'
```

### Demo scenario

1. Register a new package via the RPC handler:
```shell
curl localhost:8080/PackageTracker/package1/registerPackage \
  -H 'content-type: application/json' -d '{"finalDestination": "Bridge 6, Amsterdam"}'
```

2. Start a Kafka producer and publish some messages to update the location of the package on the `package-location-updates` topic:
```shell
docker exec -it broker kafka-console-producer --bootstrap-server broker:29092 --topic package-location-updates --property parse.key=true --property key.separator=:
```
Send messages like
```
package1:{"timestamp": "2024-10-10 13:00", "location": "Pinetree Road 5, Paris"}
package1:{"timestamp": "2024-10-10 14:00", "location": "Mountain Road 155, Brussels"}
```

3. Query the package location via the RPC handler:
```shell
curl localhost:8080/PackageTracker/package1/getPackageInfo
```
or via the CLI: `restate kv get PackageTracker package1`

You can see how the state was enriched by the initial RPC event and the subsequent Kafka events:
```
🤖 State:
―――――――――
                          
 Service  PackageTracker 
 Key      package1        

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
