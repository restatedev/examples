# TypeScript Patterns and Use Cases

Common tasks and patterns implemented with Restate:

| Use case / Pattern                                     |                                                         |                                                                                                        | Difficulty   | Description                                                                                                                                                                                    |
|--------------------------------------------------------|---------------------------------------------------------|--------------------------------------------------------------------------------------------------------|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Durable RPC, Idempotency and Concurrency               | [code](src/durablerpc/express_app.ts)                   | [README](README.md#durable-rpc-idempotency-and-concurrency)                                            | Basic        | Use the programmatic clients to invoke Restate handlers. Add idempotency keys for deduplication. And limit concurrency via Virtual Objects.                                                    |
| (Delayed) Message Queue                                | [code](src/queue/task_submitter.ts)                     | [README](README.md#delayed-message-queue)                                                              | Basic        | Use Restate as a queue. Send a (delayed) event to a handler. Optionally, retrieve the response later.                                                                                          |
| Sagas                                                  | [code](src/sagas/booking_workflow.ts)                   | [README](README.md#sagas)                                                                              | Basic        | Preserve consistency by tracking undo actions and running them when code fails halfway through. Restate guarantees completion.                                                                 |
| Webhook Event Processing                               | [code](src/webhookcallbacks/webhook_callback_router.ts) | [README](#durable-webhook-event-processing)                                                           | Basic        | Point webhook callbacks to a Restate handler for durable event processing.   |
| Scheduling Tasks                                       | [code](src/schedulingtasks/payment_reminders.ts)        | [README](#scheduling-tasks-and-durable-webhooks)                                                       | Basic        | Use Restate as scheduler. Schedule tasks for later and ensure the task is triggered and executed. |
| Stateful Actors and Durable State Machines             | [code](src/statefulactors/machine_operator.ts)          | [README](README.md#stateful-actors-and-durable-state-machines)                                         | Basic        | Stateful Actor representing a machine in our factory. The handlers bring the machine up and down and track the state transitions, built as a Restate Virtual Object for automatic state persistence. |
| Event processing: Transactional handlers               | [code](src/eventtransactions/user_feed.ts)              | [README](README.md#event-processing-transactional-handlers-with-durable-side-effects-and-timers)       | Basic        | Processing events (from Kafka) to update various downstream systems in a transactional way. With durable side effects and timers.                                                              |
| Event processing: Enriching streams                    | [code](src/eventenrichment/package_tracker.ts)          | [README](README.md#event-processing-event-enrichment)                                                  | Basic        | Stateful functions/actors connected to Kafka and callable over RPC.                                                                                                                            |
| Parallelizing work                                     | [code](src/parallelizework/fan_out_worker.ts)           | [README](README.md#parallelizing-work)                                                                 | Intermediate | Execute a list of tasks in parallel and then gather their result.                                                                                                                              |
| Turn slow sync tasks into async                        | [code](src/dataupload/client.ts)                        | [README](README.md#async-data-upload)                                                                  | Intermediate | Kick of a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long.                                                                                       |
| Payment state machines                                 | [code](src/statemachinepayments/payment_service.ts)     | [README](README.md#payment-state-machine)                                                              | Advanced     | State machine example that tracks a payment process, ensuring consistent processing and cancellations.                                                                                         |
| Payments: combining sync responses and async callbacks | [code](src/signalspayments/payment_service.ts)          | [README](README.md#payment-signals---combining-sync-responses-and-async-webhook-callbacks-from-stripe) | Advanced     | Handling async payment callbacks for slow payments, with Stripe.                                                                                                                               |
| Patterns: Durable Promises                             | [code](durablepromise)                                  | [README](README.md#pattern-durable-promises)                                                           | Advanced     | Custom implementation of Promises/Futures that are durable across processes and failures.                                                                                                      |
| Patterns: Priority Queue                               | [code](priorityqueue)                                   | [README](README.md#pattern-priority-queue)                                                             | Advanced     | Example of implementing a priority queue to manage task execution order.                                                                                                                       |

First, install the dependencies:

```shell
npm install
``` 

## Durable RPC, Idempotency and Concurrency

This example shows an example of:
- **Durable RPC**: once a request has reached Restate, it is guaranteed to be processed
- **Exactly-once processing**: Ensure that duplicate requests are not processed multiple times via idempotency keys

The example shows how you can programmatically submit a requests to a Restate service.
Every request gets processed durably, and deduplicated based on the idempotency key.

The example shows a [client](src/durablerpc/express_app.ts) that receives product reservation requests and forwards them to the product service.
The [Product service](src/durablerpc/product_service.ts) is a Restate service that durably processes the reservation requests and deduplicates them.
Each product can be reserved only once.

### Running the example
1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `npx tsx watch ./src/durablerpc/product_service.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`
4. Start the Express app: `npx tsx watch ./src/durablerpc/express_app.ts`

### Demo scenario
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

## (Delayed) Message Queue

Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once.

Files to look at:
- [Task Submitter](src/queue/task_submitter.ts): schedules tasks via send requests with and idempotency key.
    - The **send requests** put the tasks in Restate's queue. The task submitter does not wait for the task response.
    - The **idempotency key** in the header is used by Restate to deduplicate requests.
    - If a delay is set, the task will be executed later and Restate will track the timer durably, like a **delayed task queue**.
- [Async Task Worker](src/queue/async_task_worker.ts): gets invoked by Restate for each task in the queue.

## Sagas

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
2. Start the service: `npx tsx watch ./src/sagas/booking_workflow.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080` 

### Demo scenario

Have a look at the logs to see how the compensations run in case of a terminal error.

Start the workflow:
```shell
curl -X POST localhost:8080/BookingWorkflow/trip123/run -H 'content-type: application/json' -d '{
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
Flight 51e219f8-eb34-4384-a5ff-88607e89c220 reserved
Car 643e2aea-7576-403b-adc1-53b9c183ad83 reserved
This payment should never be accepted! Aborting booking.
Payment 619d5483-7eca-44ff-8b4d-a7fac5f444d3 refunded
Car 643e2aea-7576-403b-adc1-53b9c183ad83 cancelled
Flight 51e219f8-eb34-4384-a5ff-88607e89c220 cancelled
[restate] [BookingWorkflow/run][inv_10CFKeNWhtWx37Ao0Q9uQ0Oma0zlN6zs2J][2024-12-16T10:12:08.667Z] WARN:  Function completed with an error.
 TerminalError: This payment could not be accepted!
... rest of trace ...
```

## Durable Webhook Event Processing

This example processes webhook callbacks from a payment provider.
Restate handlers can be used as the target for webhook callbacks.
This turns handlers into durable event processors that ensure the event is processed exactly once.
You don't need to do anything special!

## Scheduling Tasks 
This example processes failed payment events from a payment provider.
The service reminds the customer for 3 days to update their payment details, and otherwise escalates to support.

To schedule the reminders, the handler uses Restate's durable timers and delayed calls.
The handler calls itself three times in a row after a delay of one day, and then stops the loop and calls another handler.

Restate tracks the timer across failures, and triggers execution. 

## Stateful Actors and Durable State Machines

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
2. Start the service: `npx tsx watch ./src/statefulactors/machine_operator.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

### Demo scenario

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

For example:
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

### Demo scenario


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

You can see how the state was enriched by the initial RPC event and the subsequent Kafka events:
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

## Parallelizing work

This example shows how to use the Restate SDK to **execute a list of tasks in parallel and then gather their result**.
Also known as fan-out, fan-in.

The example implements a [worker service](src/parallelizework/fan_out_worker.ts), that takes a task as input.
It then splits the task into subtasks, executes them in parallel, and then gathers the results.

Restate guarantees and manages the execution of all the subtasks across failures.
You can run this on FaaS infrastructure, like AWS Lambda, and it will scale automatically.

## Async Data Upload

This example shows how to use the Restate SDK to **kick of a synchronous task and turn it into an asynchronous one if it takes too long**.

The example implements a [data upload service](src/dataupload/data_upload_service.ts), that creates a bucket, uploads data to it, and then returns the URL.

The [upload client](src/dataupload/client.ts) does a synchronous request to upload the file, and the server will respond with the URL.

If the upload takes too long, however, the client asks the upload service to send the URL later in an email.

### Running the examples
1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `npx tsx watch ./src/dataupload/data_upload_service.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

### Demo scenario

Run the upload client with a userId: `npx tsx ./src/dataupload/client.ts`

This will submit an upload workflow to the data upload service.
The workflow will run only once per ID, so you need to provide a new ID for each run.

Have a look at the logs to see how the execution switches from synchronously waiting to the response to requesting an email:

## Payment State Machine

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
2. Start the service: `npx tsx watch ./src/statemachinepayments/payment_service.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

### Demo scenario
Send some requests:

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

## Payment Signals - Combining Sync Responses and Async Webhook Callbacks from Stripe

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
2. Start the service: `npx tsx watch ./src/signalspayments/payment_service.ts`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

4. Create a free Stripe test account. This requires no verification, but you can only work
   with test data, not make real payments. Good enough for this example.

5. In the [Stripe UI](dashboard.stripe.com), go to ["Developers" -> "API Keys"](https://dashboard.stripe.com/test/apikeys) and copy the _secret key_ (`sk_test_...`).
   Add it to the [stripe_utils.ts](src/signalspayment/stripe_utils.ts) file. Because this is a dev-only
   API key, it supports only test data, so it isn't super sensitive.

6. Run launch _ngrok_:
    1. [Get a free account](dashboard.ngrok.com)
    2. [Copy your auth token](https://dashboard.ngrok.com/get-started/your-authtoken)
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

## Pattern: Durable Promises

The Durable Promises implemented in this example work like regular futures/promises,
but are durable cross processes and failures.

Can be used to build simple and reliable **callbacks**,
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
* Start the Durable Promises implementation in another shell: `npx tsx watch ./src/durablepromise/dp/runner.ts 9080`
* Register Durable Promises service: `restate -y deployment register "localhost:9080" --force`

_Note: the '--force' flag here is to circumvent all checks relating to graceful upgrades,
because this here is only an example/playground, not a production setup._

You can now await and resolve promises from different processes at different times.
With via simple HTTP calls (see above) or the TypeScript API.

You can start the bundled examples via 
- `npx tsx ./src/durablepromise/1_example.ts`
- `npx tsx ./src/durablepromise/2_example_process.ts`
- `npx tsx ./src/durablepromise/3_example_parallel_processes.ts`
- `npx tsx ./src/durablepromise/4_example.ts`,
optionally passing `[promise-id] [restateUri]` as parameters.

## Pattern: Priority queue

An example of implementing your own priority queue using Restate state and awakeables.

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
