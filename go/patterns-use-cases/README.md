# Go Patterns and Use Cases

Common tasks and patterns implemented with Restate:

| Use case / Pattern                                                                                                      | Description                                                                                                     |
|-------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| [Durable RPC, Idempotency & Concurrency](README.md#durable-rpc-idempotency-and-concurrency)                             | Use programmatic clients to call Restate handlers. Add idempotency keys for deduplication. [(code)](src/durablerpc/express_app.ts)                      |
| [(Delayed) Message Queue](README.md#delayed-message-queue)                                                              | Restate as a queue: Send (delayed) events to handlers. Optionally, retrieve the response later. [(code)](src/queue/task_submitter.ts)                 |
| [Sagas](README.md#sagas)                                                                                               | Preserve consistency by tracking undo actions and running them when code fails halfway through. [(code)](src/sagas/booking_workflow.ts)                 |
| [Webhook Callbacks](#durable-webhook-event-processing)                                                                 | Point webhook callbacks to a Restate handler for durable event processing. [(code)](src/webhookcallbacks/webhook_callback_router.ts)                                    |
| [Scheduling Tasks](#scheduling-tasks)                                                             | Restate as scheduler: Schedule tasks for later and ensure the task is triggered and executed. [(code)](src/schedulingtasks/payment_reminders.ts)                 |
| [Stateful Actors and State Machines](README.md#stateful-actors-and-durable-state-machines)                             | Stateful Actor representing a machine in our factory. Track state transitions with automatic state persistence. [(code)](src/statefulactors/machine_operator.ts) |
| [Transactional Event Processing](README.md#event-processing-transactional-handlers-with-durable-side-effects-and-timers)| Process events from Kafka to update various downstream systems in a transactional way. [(code)](src/eventtransactions/user_feed.ts)                        |
| [Event enrichment / Joins](README.md#event-processing-event-enrichment)                                                 | Stateful functions/actors connected to Kafka and callable over RPC. [(code)](src/eventenrichment/package_tracker.ts)                                           |
| [Parallelizing work](README.md#parallelizing-work)                                                                      | Execute a list of tasks in parallel and then gather their result. [(code)](src/parallelizework/fan_out_worker.ts)                                                                                                                              |
| [Turn slow sync tasks into async](README.md#async-data-upload)                                                          | Kick off a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long. [(code)](src/dataupload/client.ts)                                                                                       |


## Durable RPC, Idempotency and Concurrency

This example shows an example of:
- **Durable RPC**: once a request has reached Restate, it is guaranteed to be processed
- **Exactly-once processing**: Ensure that duplicate requests are not processed multiple times via idempotency keys

The example shows how you can programmatically submit a requests to a Restate service.
Every request gets processed durably, and deduplicated based on the idempotency key.

The example shows a [client](src/durablerpc/client/client.go) that receives product reservation requests and forwards them to the product service.
The [Product service](src/durablerpc/service/productservice.go) is a Restate service that durably processes the reservation requests and deduplicates them.
Each product can be reserved only once.

### Running the example
1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `go run ./src/durablerpc/service`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

### Demo scenario
Run the client to let it send a request to reserve a product: 
```shell
go run ./src/durablerpc/client --productid 1 --reservationid 1
```
The response will be `true`.

Let's change the reservation ID and run the request again:
```shell
go run ./src/durablerpc/client --productid 1 --reservationid 2
```
This will give us `false` because this product is already reserved, so we can't reserve it again.

However, if we run the first request again with same reservation ID, we will get `true` again:
```shell
go run ./src/durablerpc/client --productid 1 --reservationid 1
``` 
Restate deduplicated the request (with the reservation ID as idempotency key) and returned the first response.

## (Delayed) Message Queue

Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once.

Files to look at:
- [Task Submitter](src/queue/client/tasksubmitter.go): schedules tasks via send requests with and idempotency key.
    - The **send requests** put the tasks in Restate's queue. The task submitter does not wait for the task response.
    - The **idempotency key** in the header is used by Restate to deduplicate requests.
    - If a delay is set, the task will be executed later and Restate will track the timer durably, like a **delayed task queue**.
- [Async Task Worker](src/queue/service/asynctaskworker.go): gets invoked by Restate for each task in the queue.

## Sagas

An example of a trip reservation workflow, using the saga pattern to undo previous steps in case of an error.

Durable Execution's guarantee to run code to the end in the presence of failures, and to deterministically recover previous steps from the journal, makes sagas easy.
Every step pushes a compensation action (an undo operation) to a stack. In the case of an error, those operations are run.

The main requirement is that steps are implemented as journaled operations, like `restate.Run()` or RPC/messaging.

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
2. Start the service: `go run ./src/sagas`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

### Demo scenario

Have a look at the logs to see how the compensations run in case of a terminal error.

Start the workflow:
```shell
curl -X POST localhost:8080/BookingWorkflow/trip123/Run -H 'content-type: application/json' -d '{
  "flights": {
    "flight_id": "12345",
    "passenger_name": "John Doe"
  },
  "car": {
    "pickup_location": "Airport",
    "rental_date": "2024-12-16"
  },
  "payment_info": {
    "card_number": "4111111111111111",
    "amount": 1500
  }
}'
```

Have a look at the logs to see the cancellations of the flight and car booking in case of a terminal error.

<details>
<summary>View logs</summary>

```
2025/01/06 16:16:02 INFO Handling invocation method=BookingWorkflow/Run invocationID=inv_17l9ZLwBY3bz6HEIybYB6Rh9SbV6khuc0N
2025/01/06 16:16:02 INFO Handling invocation method=Flights/Reserve invocationID=inv_1kNkgfEJjWp67I8WxNRHZN79XZprWqPWp3
2025/01/06 16:16:02 INFO Flight reserved: 8685229b-c219-466f-9a70-9f54b968a1b9
2025/01/06 16:16:02 INFO Invocation completed successfully method=Flights/Reserve invocationID=inv_1kNkgfEJjWp67I8WxNRHZN79XZprWqPWp3
2025/01/06 16:16:02 INFO Handling invocation method=CarRentals/Reserve invocationID=inv_1cXn5IBHJhEK7ihQnoXIX8rVLvWWAi27EB
2025/01/06 16:16:02 INFO Car reserved:2b5be5c4-944c-48a4-abb3-e0e0039151e9
2025/01/06 16:16:02 INFO Invocation completed successfully method=CarRentals/Reserve invocationID=inv_1cXn5IBHJhEK7ihQnoXIX8rVLvWWAi27EB
2025/01/06 16:16:02 ERROR This payment should never be accepted! Aborting booking.
2025/01/06 16:16:02 INFO Handling invocation method=Flights/Cancel invocationID=inv_1d4KgHFg2EFF62ccgILiNAgPwKx4tmskyl
2025/01/06 16:16:02 INFO Flight cancelled: 8685229b-c219-466f-9a70-9f54b968a1b9
2025/01/06 16:16:02 INFO Invocation completed successfully method=Flights/Cancel invocationID=inv_1d4KgHFg2EFF62ccgILiNAgPwKx4tmskyl
2025/01/06 16:16:02 INFO Handling invocation method=CarRentals/Cancel invocationID=inv_15QXMdt8GLYU18PoNhVICXbqRg0x9lQsIp
2025/01/06 16:16:02 INFO Car cancelled2b5be5c4-944c-48a4-abb3-e0e0039151e9
2025/01/06 16:16:02 INFO Invocation completed successfully method=CarRentals/Cancel invocationID=inv_15QXMdt8GLYU18PoNhVICXbqRg0x9lQsIp
2025/01/06 16:16:02 INFO Refunded payment: e4eac4a9-47c9-4087-9502-cb0fff1218c6
2025/01/06 16:16:02 INFO Invocation completed successfully method=BookingWorkflow/Run invocationID=inv_17l9ZLwBY3bz6HEIybYB6Rh9SbV6khuc0N
```
</details>

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
2. Start the service: `go run ./src/statefulactors`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

### Demo scenario

Invoke the state machine transitions like
```shell
curl -X POST localhost:8080/MachineOperator/my-machine/SetUp
```

To illustrate the concurrency safety here, send multiple requests without waiting on
results and see how they play out sequentially per object (state machine).
Copy all the curl command lines below and paste them to the terminal together.
You will see both from the later results (in the terminal with the curl commands) and in
the log of the service that the requests queue per object key and safely execute
unaffected by crashes and recoveries.

```shell
(curl -X POST localhost:8080/MachineOperator/a/SetUp &)
(curl -X POST localhost:8080/MachineOperator/a/TearDown &)
(curl -X POST localhost:8080/MachineOperator/b/SetUp &)
(curl -X POST localhost:8080/MachineOperator/b/SetUp &)
(curl -X POST localhost:8080/MachineOperator/b/TearDown &)
echo "executing..."
```

<details>
<summary>View logs</summary>

```
2025/01/07 15:43:39 WARN Accepting requests without validating request signatures; handler access must be restricted
2025/01/07 15:43:48 INFO Handling invocation method=MachineOperator/TearDown invocationID=inv_1dceKvwtEc2n73auyTOQxa4kxIlWRcptG9
2025/01/07 15:43:48 INFO Beginning transition to down: a
👻 A failure happened!2025/01/07 15:43:48 ERROR Invocation returned a non-terminal failure method=MachineOperator/TearDown invocationID=inv_1dceKvwtEc2n73auyTOQxa4kxIlWRcptG9 err="a failure happened"
2025/01/07 15:43:48 INFO Handling invocation method=MachineOperator/SetUp invocationID=inv_174rq2A9bm3T0atyOfXqUIVy47VcOx80Jb
2025/01/07 15:43:48 INFO Beginning transition to up: b
2025/01/07 15:43:48 INFO Handling invocation method=MachineOperator/TearDown invocationID=inv_1dceKvwtEc2n73auyTOQxa4kxIlWRcptG9
2025/01/07 15:43:48 INFO Beginning transition to down: a
2025/01/07 15:43:53 INFO Done transitioning to up: b
2025/01/07 15:43:53 INFO Invocation completed successfully method=MachineOperator/SetUp invocationID=inv_174rq2A9bm3T0atyOfXqUIVy47VcOx80Jb
2025/01/07 15:43:53 INFO Handling invocation method=MachineOperator/SetUp invocationID=inv_174rq2A9bm3T1DTVZFHn9ClEXySogMbf8J
2025/01/07 15:43:53 INFO Invocation completed successfully method=MachineOperator/SetUp invocationID=inv_174rq2A9bm3T1DTVZFHn9ClEXySogMbf8J
2025/01/07 15:43:53 INFO Handling invocation method=MachineOperator/TearDown invocationID=inv_174rq2A9bm3T3sOGmjdHa6cfEb2eFhNyaB
2025/01/07 15:43:53 INFO Beginning transition to down: b
👻 A failure happened!2025/01/07 15:43:53 ERROR Invocation returned a non-terminal failure method=MachineOperator/TearDown invocationID=inv_174rq2A9bm3T3sOGmjdHa6cfEb2eFhNyaB err="a failure happened"
2025/01/07 15:43:53 INFO Done transitioning to down: a
2025/01/07 15:43:53 INFO Invocation completed successfully method=MachineOperator/TearDown invocationID=inv_1dceKvwtEc2n73auyTOQxa4kxIlWRcptG9
2025/01/07 15:43:53 INFO Handling invocation method=MachineOperator/SetUp invocationID=inv_1dceKvwtEc2n4c2TwvTC3GhkUrqOH9PvCV
2025/01/07 15:43:53 INFO Beginning transition to up: a
2025/01/07 15:43:53 INFO Handling invocation method=MachineOperator/TearDown invocationID=inv_174rq2A9bm3T3sOGmjdHa6cfEb2eFhNyaB
2025/01/07 15:43:53 INFO Beginning transition to down: b
2025/01/07 15:43:58 INFO Done transitioning to up: a
2025/01/07 15:43:58 INFO Invocation completed successfully method=MachineOperator/SetUp invocationID=inv_1dceKvwtEc2n4c2TwvTC3GhkUrqOH9PvCV
2025/01/07 15:43:58 INFO Done transitioning to down: b
2025/01/07 15:43:58 INFO Invocation completed successfully method=MachineOperator/TearDown invocationID=inv_174rq2A9bm3T3sOGmjdHa6cfEb2eFhNyaB
```

</details>

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

3. Start the service: `go run ./src/eventtransactions`

4. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

5. Let Restate subscribe to the Kafka topic `social-media-posts` and invoke `UserFeed/ProcessPost` on each message.
    ```shell
    curl localhost:9070/subscriptions -H 'content-type: application/json' \
    -d '{
        "source": "kafka://my-cluster/social-media-posts",
        "sink": "service://UserFeed/ProcessPost",
        "options": {"auto.offset.reset": "earliest"}
    }'
    ```

6. Start a Kafka producer and send some messages to the `social-media-posts` topic:
    ```shell
    docker exec -it broker kafka-console-producer --bootstrap-server broker:29092 --topic social-media-posts --property parse.key=true --property key.separator=:
    ```

7. Submit some posts for two different users:
    ```
    userid1:{"content": "Hi! This is my first post!", "metadata": "public"}
    userid2:{"content": "Hi! This is my first post!", "metadata": "public"}
    userid1:{"content": "Hi! This is my second post!", "metadata": "public"}
    ```

8. Our Kafka broker only has a single partition so all these messages end up on the same partition.
  You can see in the logs how events for different users are processed in parallel, but events for the same user are processed sequentially:
    
    <details>
    <summary>Logs</summary>
    
    ```
    2025/01/03 16:33:16 INFO Handling invocation method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN2iR3HzJOiyzymCA9yPbT1f
    Created post 3dae1f20-a7e5-4f3f-8113-3a4b91e48e72 for user userid1 with content: Hi! This is my first post!
    Content moderation for post 3dae1f20-a7e5-4f3f-8113-3a4b91e48e72 is still pending... Will check again in 5 seconds
    2025/01/03 16:33:19 INFO Handling invocation method=UserFeed/ProcessPost invocationID=inv_1eZjTF0DbaEl2J2i6fbVKbMmbeHAjPGBe9
    Created post c4672199-7a06-4540-8bf7-a5ec15327346 for user userid2 with content: Hi! This is my first post!
    Content moderation for post c4672199-7a06-4540-8bf7-a5ec15327346 is still pending... Will check again in 5 seconds
    Content moderation for post 3dae1f20-a7e5-4f3f-8113-3a4b91e48e72 is still pending... Will check again in 5 seconds
    Content moderation for post c4672199-7a06-4540-8bf7-a5ec15327346 is done
    Updating the user feed for user userid2 with post c4672199-7a06-4540-8bf7-a5ec15327346
    2025/01/03 16:33:24 INFO Invocation completed successfully method=UserFeed/ProcessPost invocationID=inv_1eZjTF0DbaEl2J2i6fbVKbMmbeHAjPGBe9
    2025/01/03 16:33:24 INFO Handling invocation method=UserFeed/ProcessPost invocationID=inv_1eZjTF0DbaEl5vwb9ckycf7xsj0c5wWo0h
    Created post ede539a3-0c53-4d4b-a93e-8fdef3330de6 for user userid2 with content: Hi! This is my first post!
    Content moderation for post ede539a3-0c53-4d4b-a93e-8fdef3330de6 is still pending... Will check again in 5 seconds
    Content moderation for post 3dae1f20-a7e5-4f3f-8113-3a4b91e48e72 is done
    Updating the user feed for user userid1 with post 3dae1f20-a7e5-4f3f-8113-3a4b91e48e72
    2025/01/03 16:33:32 INFO Invocation completed successfully method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN2iR3HzJOiyzymCA9yPbT1f
    2025/01/03 16:33:32 INFO Handling invocation method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN6neIyklfqzeQVAun6OI6hb
    Created post a31a5ebb-1e19-4629-a7ae-b1e80bb469ec for user userid1 with content: Hi! This is my first post!
    Content moderation for post a31a5ebb-1e19-4629-a7ae-b1e80bb469ec is still pending... Will check again in 5 seconds
    Content moderation for post ede539a3-0c53-4d4b-a93e-8fdef3330de6 is still pending... Will check again in 5 seconds
    Content moderation for post ede539a3-0c53-4d4b-a93e-8fdef3330de6 is done
    Updating the user feed for user userid2 with post ede539a3-0c53-4d4b-a93e-8fdef3330de6
    2025/01/03 16:33:44 INFO Invocation completed successfully method=UserFeed/ProcessPost invocationID=inv_1eZjTF0DbaEl5vwb9ckycf7xsj0c5wWo0h
    Content moderation for post a31a5ebb-1e19-4629-a7ae-b1e80bb469ec is still pending... Will check again in 5 seconds
    Content moderation for post a31a5ebb-1e19-4629-a7ae-b1e80bb469ec is done
    Updating the user feed for user userid1 with post a31a5ebb-1e19-4629-a7ae-b1e80bb469ec
    2025/01/03 16:33:52 INFO Invocation completed successfully method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN6neIyklfqzeQVAun6OI6hb
    2025/01/03 16:33:52 INFO Handling invocation method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN4MGP7mftRXvTi5JIWKSJbP
    Created post 7da58f9a-4af4-4a35-94b0-90879a20390d for user userid1 with content: Hi! This is my second post!
    Content moderation for post 7da58f9a-4af4-4a35-94b0-90879a20390d is still pending... Will check again in 5 seconds
    Content moderation for post 7da58f9a-4af4-4a35-94b0-90879a20390d is still pending... Will check again in 5 seconds
    Content moderation for post 7da58f9a-4af4-4a35-94b0-90879a20390d is done
    Updating the user feed for user userid1 with post 7da58f9a-4af4-4a35-94b0-90879a20390d
    2025/01/03 16:34:02 INFO Invocation completed successfully method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN4MGP7mftRXvTi5JIWKSJbP
    2025/01/03 16:34:02 INFO Handling invocation method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN6C0ovGVJ4Bvrhxhw9Lnpx7
    Created post b8c0d187-1148-41d2-9060-d25fe0d9bdfe for user userid1 with content: Hi! This is my second post!
    Content moderation for post b8c0d187-1148-41d2-9060-d25fe0d9bdfe is still pending... Will check again in 5 seconds
    Content moderation for post b8c0d187-1148-41d2-9060-d25fe0d9bdfe is still pending... Will check again in 5 seconds
    Content moderation for post b8c0d187-1148-41d2-9060-d25fe0d9bdfe is done
    Updating the user feed for user userid1 with post b8c0d187-1148-41d2-9060-d25fe0d9bdfe
    2025/01/03 16:34:37 INFO Invocation completed successfully method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN6C0ovGVJ4Bvrhxhw9Lnpx7
    ```
    
    As you see, slow events do not block other slow events. Restate effectively created a queue per user ID.
    
    The handler creates the social media post and waits for content moderation to finish.
    If the moderation takes long, and there is an infrastructure crash, then Restate will trigger a retry.
    The handler will fast-forward to where it was, will recover the post ID and will continue waiting for moderation to finish.
    
    You can try it out by killing Restate or the service halfway through processing a post.
    
    </details>

## Event Processing: Event Enrichment / Joins

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

3. Start the service: `go run ./src/eventenrichment`

4. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

5. Let Restate subscribe to the Kafka topic `package-location-updates` and invoke `PackageTracker/UpdateLocation` on each message.
    ```shell
    curl localhost:9070/subscriptions -H 'content-type: application/json' \
    -d '{
        "source": "kafka://my-cluster/package-location-updates",
        "sink": "service://PackageTracker/UpdateLocation",
        "options": {"auto.offset.reset": "earliest"}
    }'
    ```

6. Register a new package via the RPC handler:
    ```shell
    curl localhost:8080/PackageTracker/package123/RegisterPackage \
      -H 'content-type: application/json' -d '{"finalDestination": "Bridge 6, Amsterdam"}'
    ```

7. Start a Kafka producer and publish some messages to update the location of the package on the `package-location-updates` topic:
    ```shell
    docker exec -it broker kafka-console-producer --bootstrap-server broker:29092 --topic package-location-updates --property parse.key=true --property key.separator=:
    ```
    Send messages like
    ```
    package123:{"timestamp": "2024-10-10 13:00", "location": "Pinetree Road 5, Paris"}
    package123:{"timestamp": "2024-10-10 14:00", "location": "Mountain Road 155, Brussels"}
    ```

8. Query the package location via the RPC handler:
    ```shell
    curl localhost:8080/PackageTracker/package123/getPackageInfo
    ```
    or via the CLI: `restate kv get PackageTracker package123`
    
    You can see how the state was enriched by the initial RPC event and the subsequent Kafka events:
   
    <details>
    <summary>Output</summary>
   
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
    
    
## Parallelizing work

This example shows how to use the Restate SDK to **execute a list of tasks in parallel and then gather their result**.
Also known as fan-out, fan-in.

The example implements a [worker service](src/parallelizework/fanoutworker.go), that takes a task as input.
It then splits the task into subtasks, executes them in parallel, and then gathers the results.

Restate guarantees and manages the execution of all the subtasks across failures.
You can run this on FaaS infrastructure, like AWS Lambda, and it will scale automatically.

## Async Data Upload

This example shows how to use the Restate SDK to **kick of a synchronous task and turn it into an asynchronous one if it takes too long**.

The example implements a [data upload service](src/dataupload/service/datauploadservice.go), that creates a bucket, uploads data to it, and then returns the URL.

The [upload client](src/dataupload/client/client.go) does a synchronous request to upload the file, and the server will respond with the URL.

If the upload takes too long, however, the client asks the upload service to send the URL later in an email.

### Running the examples
1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `go run ./src/dataupload/service`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

### Demo scenario

Run the upload client with a userId: `go run ./src/dataupload/client`

This will submit an upload workflow to the data upload service.
The workflow will run only once per ID, so you need to provide a new ID for each run.

Have a look at the logs to see how the execution switches from synchronously waiting to the response to requesting an email:
