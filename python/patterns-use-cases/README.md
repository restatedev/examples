# Python Patterns and Use Cases

Common tasks and patterns implemented with Restate:

#### Communication
- **[Durable RPC, Idempotency and Concurrency](README.md#durable-rpc-idempotency--concurrency)**: Restate persists requests and makes sure they execute exactly-once. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/durablerpc/client.py)
- **[(Delayed) Message Queue](README.md#delayed-message-queue)**: Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/queue/task_submitter.py)
- **[Convert Sync Tasks to Async](README.md#convert-sync-tasks-to-async)**: Kick off a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/syncasync/client.py)

#### Orchestration patterns
- **[Sagas](README.md#sagas)**: Preserve consistency by tracking undo actions and running them when code fails halfway through. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/sagas/booking_workflow.py)
- **[Stateful Actors and State Machines](README.md#stateful-actors-and-state-machines)**: State machine with a set of transitions, built as a Restate Virtual Object for automatic state persistence. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/statefulactors/machine_operator.py)
- **[Payment State Machines (Advanced)](README.md#payment-state-machines)**: State machine example that tracks a payment process, ensuring consistent processing and cancellations. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/statemachinepayments/payment_processor.py)

#### Scheduling
- **[Parallelizing Work](README.md#parallelizing-work)**: Execute a list of tasks in parallel and then gather their result. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/parallelizework/fan_out_worker.py)
- **[Payment Signals (Advanced)](README.md#payment-signals)**: Handling async payment callbacks for slow payments, with Stripe. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/signalspayments/payment_service.py)

#### Event processing
- **[Transactional Event Processing](README.md#transactional-event-processing)**: Processing events (from Kafka) to update various downstream systems in a transactional way. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/eventtransactions/user_feed.py)
- **[Event Enrichment / Joins](README.md#event-enrichment--joins)**: Stateful functions/actors connected to Kafka and callable over RPC. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/eventenrichment/package_tracker.py)

To get started, create a venv and install the requirements file:

```shell
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Durable RPC, Idempotency & Concurrency
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/durablerpc/client.py)

This example shows:
- **Durable RPC**: once a request has reached Restate, it is guaranteed to be processed
- **Exactly-once processing**: Ensure that duplicate requests are not processed multiple times via idempotency keys
- **Concurrency**: Restate executes requests to the same Virtual Object key sequentially, to ensure consistency of its K/V state

The example shows how you can programmatically submit a requests to a Restate service.
Every request gets processed durably, and deduplicated based on the idempotency key.

- The [client](src/durablerpc/client.py) that receives product reservation requests and forwards them to the product service.
- The [Product service](src/durablerpc/product_service.py) is a Restate service that durably processes the reservation requests and deduplicates them. Each product can be reserved only once.

<details>
<summary><strong>Running the example</strong></summary>

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `python -m hypercorn --config hypercorn-config.toml src/durablerpc/product_service:app`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

Run the client to let it send a request to reserve a product:
```shell
python src/durablerpc/client.py product1 reservation1
```

This will give us `{"reserved": True}`.

Let's change the reservation ID and run the request again:
```shell
python src/durablerpc/client.py product1 reservation2
```

This will give us `{"reserved": False}` because this product is already reserved, so we can't reserve it again.

However, if we run the first request again with same reservation ID, we will get `{"reserved": True}` again:
```shell
python src/durablerpc/client.py product1 reservation1
```
Restate deduplicated the request (with the reservation ID as idempotency key) and returned the first response.

</details>

## (Delayed) Message Queue
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/queue/task_submitter.py)

Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once.

Files to look at:
- [Task Submitter](src/queue/task_submitter.py): schedules tasks via send requests with and idempotency key.
    - The **send requests** put the tasks in Restate's queue. The task submitter does not wait for the task response.
    - The **idempotency key** in the header is used by Restate to deduplicate requests.
    - If a delay is set, the task will be executed later and Restate will track the timer durably, like a **delayed task queue**.
- [Async Task Worker](src/queue/async_task_worker.py): gets invoked by Restate for each task in the queue.


<details>
<summary><strong>Running the example</strong></summary>

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `python -m hypercorn --config hypercorn-config.toml src/queue/async_task_worker:app`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

Submit a task with a delay: `python src/queue/task_submitter.py task123`

You will see the task executed after
```
Submitting task with idempotency key: task123
Task submitted: {'invocationId': 'inv_1lloi4vK3cnG0T2Tsteh8rd99NrGpgtsYh', 'status': 'Accepted'}
Task result: Finished work on task: task123
```

If we resubmit the same task: `python src/queue/task_submitter.py task123`,
you will see that the task is not executed again (signals `PreviouslyAccepted`), but the same result is returned:
```
Submitting task with idempotency key: task123
Task submitted: {'invocationId': 'inv_1lloi4vK3cnG0T2Tsteh8rd99NrGpgtsYh', 'status': 'PreviouslyAccepted'}
Task result: Finished work on task: task123
```

</details>

## Convert Sync Tasks to Async
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/syncasync/client.py)

This example shows how to use the Restate SDK to **kick of a synchronous task and turn it into an asynchronous one if it takes too long**.

The example implements a [data upload service](src/syncasync/data_upload_service.py), that creates a bucket, uploads data to it, and then returns the URL.

The [client](src/syncasync/client.py) does a synchronous request to upload the file, and the server will respond with the URL.

If the upload takes too long, however, the client asks the upload service to send the URL later in an email.

<details>
<summary><strong>Running the example</strong></summary>

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `python -m hypercorn --config hypercorn-config.toml src/syncasync/data_upload_service:app`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

Run the upload client with a userId: `python src/syncasync/client.py my_user_id12`

This will submit an upload workflow to the data upload service.
The workflow will run only once per ID, so you need to provide a new ID for each run.

Have a look at the logs to see how the execution switches from synchronously waiting to the response to requesting an email:

<details>
<summary>View logs: fast upload</summary>

Client logs:
```
[2024-12-19 12:30:02,072] [667791] [INFO] - Start upload for my_user_id12
[2024-12-19 12:30:03,597] [667791] [INFO] - Fast upload: URL was https://s3-eu-central-1.amazonaws.com/282507974/
```
Workflow logs:
```
[2024-12-19 12:30:02,084] [667381] [INFO] -  Creating bucket with URL https://s3-eu-central-1.amazonaws.com/282507974/
[2024-12-19 12:30:02,085] [667381] [INFO] - Uploading data to target https://s3-eu-central-1.amazonaws.com/282507974/. ETA: 1.5s
```

</details>
<details>
<summary>View logs: slow upload</summary>

Client logs:
```
[2024-12-19 12:28:33,471] [667526] [INFO] - Start upload for my_user_id123
[2024-12-19 12:28:38,477] [667526] [INFO] - Slow upload... Mail the link later

```

Workflow logs:
```
[2024-12-19 12:28:33,481] [667383] [INFO] -  Creating bucket with URL https://s3-eu-central-1.amazonaws.com/23907419/
[2024-12-19 12:28:33,483] [667383] [INFO] - Uploading data to target https://s3-eu-central-1.amazonaws.com/23907419/. ETA: 10s
[2024-12-19 12:28:38,486] [667383] [INFO] - Slow upload: client requested to be notified via email
[2024-12-19 12:28:43,493] [667383] [INFO] - Sending email to my_user_id123@example.com with URL 'https://s3-eu-central-1.amazonaws.com/23907419/'
```

You see the call to `resultAsEmail` after the upload took too long, and the sending of the email.

</details>
</details>

## Sagas
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/sagas/booking_workflow.py)

An example of a trip reservation workflow, using the saga pattern to undo previous steps in case of an error.

Durable Execution's guarantee to run code to the end in the presence of failures, and to deterministically recover previous steps from the journal, makes sagas easy.
Every step pushes a compensation action (an undo operation) to a stack. In the case of an error, those operations are run.

The main requirement is that steps are implemented as journaled operations, like `ctx.run()` or RPC/messaging.

The example shows two ways you can implement the compensation, depending on the characteristics of the API/system you interact with.
1. **Two-phase commit**: The reservation is created and then confirmed or cancelled. The compensation executes 'cancel' and is added after the reservation is created.
2. **Idempotency key**: The payment is made in one shot and supplies an ID. The compensation is added before the payment is made and uses the same ID.

Note that the compensating actions need to be idempotent.

<details>
<summary><strong>Running the example</strong></summary>

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `python -m hypercorn --config hypercorn-config.toml src/sagas/booking_workflow:app`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

Have a look at the logs to see how the compensations run in case of a terminal error.

Start the workflow:
```shell
curl -X POST localhost:8080/BookingWorkflow/trip123/run -H 'content-type: application/json' -d '{
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

Have a look at the logs to see the cancellations of the flight and car booking in case of a terminal error:
```shell
[2024-12-19 18:04:01,179] [706007] [INFO] - Flight reservation created with id: 84873f15-1ad6-4899-9c81-0060b35f3755
[2024-12-19 18:04:01,184] [706007] [INFO] - Car rental reservation created with id: 246301f9-cca7-4d4d-9ef9-49cc0ccc627e
[2024-12-19 18:04:01,188] [706007] [ERROR] - This payment should never be accepted! Aborting booking.
[2024-12-19 18:04:01,189] [706007] [INFO] - Payment 90e88cb5-5ace-427c-a85a-aa3bcb4f2796 refunded
[2024-12-19 18:04:01,193] [706007] [INFO] - Car rental reservation cancelled with id: 246301f9-cca7-4d4d-9ef9-49cc0ccc627e
[2024-12-19 18:04:01,198] [706007] [INFO] - Flight reservation cancelled with id: 84873f15-1ad6-4899-9c81-0060b35f3755
```

</details>

## Stateful Actors and State Machines
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/statefulactors/machine_operator.py)

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
2. Start the service: `python -m hypercorn --config hypercorn-config.toml src/statefulactors/machine_operator:app`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

### Demo scenario

Invoke the state machine transitions like
```shell
curl -X POST localhost:8080/machine-operator/my-machine/setUp
```

To illustrate the concurrency safety here, send multiple requests without waiting on
results and see how they play out sequentially per object (state machine).
Copy all the curl command lines below and paste them to the terminal together.
You will see both from the later results (in the terminal with the curl commands) and in
the log of the service that the requests queue per object key and safely execute
unaffected by crashes and recoveries.

```shell
(curl -X POST localhost:8080/machine-operator/a/setUp &)
(curl -X POST localhost:8080/machine-operator/a/tearDown &)
(curl -X POST localhost:8080/machine-operator/b/setUp &)
(curl -X POST localhost:8080/machine-operator/b/setUp &)
(curl -X POST localhost:8080/machine-operator/b/tearDown &)
echo "executing..."
```

<details>
<summary>View logs</summary>

```shell
[2024-12-19 17:07:31,572] [698757] [INFO] - Beginning transition of a to up
[2024-12-19 17:07:31,749] [698759] [INFO] - Beginning transition of b to up
[2024-12-19 17:07:31,749] [698759] [ERROR] - A failure happened!
... rest of trace ...
Exception: A failure happened!
[2024-12-19 17:07:31,809] [698759] [INFO] - Beginning transition of b to up
[2024-12-19 17:07:31,809] [698759] [ERROR] - A failure happened!
... rest of trace ...
Exception: A failure happened!
[2024-12-19 17:07:31,931] [698759] [INFO] - Beginning transition of b to up
[2024-12-19 17:07:31,931] [698759] [ERROR] - A failure happened!
... rest of trace ...
Exception: A failure happened!
[2024-12-19 17:07:32,183] [698759] [INFO] - Beginning transition of b to up
[2024-12-19 17:07:36,581] [698757] [INFO] - Done transitioning a to up
[2024-12-19 17:07:36,583] [698757] [INFO] - Beginning transition of a to down
[2024-12-19 17:07:37,191] [698759] [INFO] - Done transitioning b to up
[2024-12-19 17:07:37,195] [698759] [INFO] - Beginning transition of b to down
[2024-12-19 17:07:41,592] [698757] [INFO] - Done transitioning a to down
[2024-12-19 17:07:42,198] [698759] [INFO] - Done transitioning b to down
```

</details>
</details>

## Payment State Machines
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/statemachinepayments/payment_processor.py)

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
2. Start the service: `python -m hypercorn --config hypercorn-config.toml src/statemachinepayments/payment_processor:app`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

Send some requests:

- Make a payment
  ```shell
  curl -X POST localhost:8080/PaymentProcessor/some-string-id/makePayment -H 'content-type: application/json' \
   -d '{  "account_id": "abc", "amount_cents": 100 }'
  ```

- Cancel a payment. The 'key' parameter is the idempotency token, there is no further request data.

  ```shell
  curl -X POST localhost:8080/PaymentProcessor/some-string-id/cancelPayment
  ```

- Have a look at the state:
```shell
restate kv get PaymentProcessor some-string-id
```
<details>
<summary>View logs</summary>

```
🤖 State:
―――――――――

 Service  PaymentProcessor
 Key      some-string-id

 KEY      VALUE
 payment  {
            "account_id": "abc",
            "amount_cents": 100
          }
 status   "CANCELLED"
```

</details>
</details>

## Parallelizing work
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/parallelizework/fan_out_worker.py)

This example shows how to use the Restate SDK to **execute a list of tasks in parallel and then gather their result**.
Also known as fan-out, fan-in.

The example implements a [worker service](src/parallelizework/fan_out_worker.py), that takes a task as input.
It then splits the task into subtasks, executes them in parallel, and then gathers the results.

Restate guarantees and manages the execution of all the subtasks across failures.
You can run this on FaaS infrastructure, like AWS Lambda, and it will scale automatically.

## Payment Signals
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/signalspayments/payment_service.py)

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
2. Start the service: `python -m hypercorn --config hypercorn-config.toml src/signalspayments/payment_service:app`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

4. Create a free Stripe test account. This requires no verification, but you can only work
   with test data, not make real payments. Good enough for this example.

5. In the [Stripe UI](https://dashboard.stripe.com), go to ["Developers" -> "API Keys"](https://dashboard.stripe.com/test/apikeys) and copy the _secret key_ (`sk_test_...`).
   Add it to the [stripe_utils.py](src/signalspayments/stripe_utils.py) file. Because this is a dev-only
   API key, it supports only test data, so it isn't super sensitive.

6. Run launch _ngrok_:
   1. [Get a free account](https://dashboard.ngrok.com)
   2. [Copy your auth token](https://dashboard.ngrok.com/get-started/your-authtoken)
   3. Download the binary, or launch a docker container. Make it forward HTTP calls to local port `8080`:
       - `NGROK_AUTHTOKEN=<your token> ngrok http 8080`
       - or `docker run --rm -it -e NGROK_AUTHTOKEN=<your token> --network host ngrok/ngrok http 8080` (on Linux command).
         Copy the public URL that ngrok shows you: `https://<some random numbers>.ngrok-free.app`

7. Go to the Stripe UI and [create a webhook](https://dashboard.stripe.com/test/webhooks)
   - Put the ngrok public URL + `/payments/processWebhook` as the webhook URL (you need to update this whenever you stop/start ngrok).
         Example: `https://<some random numbers>.ngrok-free.app/payments/processWebhook`
   - Select all _"Payment Intent"_ event types.

8. Put the webhook secret (`whsec_...`) in the [stripe_utils.py](src/signalspayments/stripe_utils.py) file.

Use as test data `pm_card_visa` for a successful payment and `pm_card_visa_chargeDeclined` for a declined payment.
Because the test data rarely triggers an async response, this example's tools can mimic that
if you add `"delayedStatus": true` to the request.

```shell
curl localhost:8080/payments/processPayment -H 'content-type: application/json' -d '{
        "payment_method_id": "pm_card_visa",
        "amount": 109,
        "delayed_status": true
}'
```

You will see the synchronous response and the webhook call in the logs:
```
[2024-12-20 09:34:39,136] [716785] [INFO] - message='Request to Stripe api' method=post url=https://api.stripe.com/v1/payment_intents
[2024-12-20 09:34:40,437] [716785] [INFO] - message='Stripe API response' path=https://api.stripe.com/v1/payment_intents response_code=200
[2024-12-20 09:34:40,440] [716785] [INFO] - Payment intent for 6f8d16a5-d40c-4f9f-9c41-4da956ca795d still processing, awaiting webhook call...
[2024-12-20 09:34:40,963] [716784] [INFO] - Received webhook call for payment intent {"id": "pi_3QY...", "object": "payment_intent", "amount": 109, "amount_capturable": 0, "amount_details": {"tip": {}}, "amount_received": 109, "application": null, "application_fee_amount": null, "automatic_payment_methods": {"allow_redirects": "always", "enabled": true}, "canceled_at": null, "cancellation_reason": null, "capture_method": "automatic_async", "client_secret": "pi_3QY1fPG04wQ4kt1o0i25MBMQ_secret_V2RtPZSeeEIPlhgSlhJSzGMtC", "confirmation_method": "automatic", "created": 1734683679, "currency": "usd", "customer": null, "description": null, "invoice": null, "last_payment_error": null, "latest_charge": "ch_3QY1fPG04wQ4kt1o0p1gkSGB", "livemode": false, "metadata": {"restate_callback_id": "prom_1yCmagFOb6zIBk-M0WZWJmZVdqmDZf0gSAAAAAQ"}, "next_action": null, "on_behalf_of": null, "payment_method": "pm_1QY1fPG04wQ4kt1obj7uoLzU", "payment_method_configuration_details": {"id": "pmc_1QY1S3G04wQ4kt1oD2XuBNNT", "parent": null}, "payment_method_options": {"card": {"installments": null, "mandate_options": null, "network": null, "request_three_d_secure": "automatic"}, "link": {"persistent_token": null}}, "payment_method_types": ["card", "link"], "processing": null, "receipt_email": null, "review": null, "setup_future_usage": null, "shipping": null, "source": null, "statement_descriptor": null, "statement_descriptor_suffix": null, "status": "succeeded", "transfer_data": null, "transfer_group": null}
[2024-12-20 09:34:40,966] [716785] [INFO] - Webhook call for 6f8d16a5-d40c-4f9f-9c41-4da956ca795d received!
[2024-12-20 09:34:40,976] [716781] [INFO] - Received webhook call for payment intent {"id": "pi_3QY...", "object": "payment_intent", "amount": 109, "amount_capturable": 0, "amount_details": {"tip": {}}, "amount_received": 0, "application": null, "application_fee_amount": null, "automatic_payment_methods": {"allow_redirects": "always", "enabled": true}, "canceled_at": null, "cancellation_reason": null, "capture_method": "automatic_async", "client_secret": "pi_3QY1fPG04wQ4kt1o0i25MBMQ_secret_V2RtPZSeeEIPlhgSlhJSzGMtC", "confirmation_method": "automatic", "created": 1734683679, "currency": "usd", "customer": null, "description": null, "invoice": null, "last_payment_error": null, "latest_charge": null, "livemode": false, "metadata": {"restate_callback_id": "prom_1yCmagFOb6zIBk-M0WZWJmZVdqmDZf0gSAAAAAQ"}, "next_action": null, "on_behalf_of": null, "payment_method": null, "payment_method_configuration_details": {"id": "pmc_1QY1S3G04wQ4kt1oD2XuBNNT", "parent": null}, "payment_method_options": {"card": {"installments": null, "mandate_options": null, "network": null, "request_three_d_secure": "automatic"}, "link": {"persistent_token": null}}, "payment_method_types": ["card", "link"], "processing": null, "receipt_email": null, "review": null, "setup_future_usage": null, "shipping": null, "source": null, "statement_descriptor": null, "statement_descriptor_suffix": null, "status": "requires_payment_method", "transfer_data": null, "transfer_group": null}
```

And for declined payments
```shell
curl localhost:8080/payments/processPayment -H 'content-type: application/json' -d '{
        "payment_method_id": "pm_card_visa_chargeDeclined",
        "amount": 109,
        "delayed_status": true
}'
```
```
[2024-12-20 09:42:58,587] [718038] [INFO] - message='Request to Stripe api' method=post url=https://api.stripe.com/v1/payment_intents
[2024-12-20 09:42:59,655] [718038] [INFO] - message='Stripe API response' path=https://api.stripe.com/v1/payment_intents response_code=402
[2024-12-20 09:42:59,655] [718038] [INFO] - error_code=card_declined error_message='Your card was declined.' error_param=None error_type=card_error message='Stripe v1 API error received'
[2024-12-20 09:42:59,657] [718038] [INFO] - Payment intent for 2d0239c9-5bd2-4d10-8c9d-3888b5c9a3c7 still processing, awaiting webhook call...
[2024-12-20 09:43:00,044] [718039] [INFO] - Received webhook call for payment intent {"id": "pi_3Q...", "object": "payment_intent", "amount": 109, "amount_capturable": 0, "amount_details": {"tip": {}}, "amount_received": 0, "application": null, "application_fee_amount": null, "automatic_payment_methods": {"allow_redirects": "always", "enabled": true}, "canceled_at": null, "cancellation_reason": null, "capture_method": "automatic_async", "client_secret": "pi_3QY1nSG04wQ4kt1o0LDvgKp2_secret_6u9ZCdKZODCKfs5TswZDEDqcc", "confirmation_method": "automatic", "created": 1734684178, "currency": "usd", "customer": null, "description": null, "invoice": null, "last_payment_error": null, "latest_charge": null, "livemode": false, "metadata": {"restate_callback_id": "prom_1WwmuXpSfrCwBk-M7-JLlV6QcnWZ7nyKlAAAAAQ"}, "next_action": null, "on_behalf_of": null, "payment_method": null, "payment_method_configuration_details": {"id": "pmc_1QY1S3G04wQ4kt1oD2XuBNNT", "parent": null}, "payment_method_options": {"card": {"installments": null, "mandate_options": null, "network": null, "request_three_d_secure": "automatic"}, "link": {"persistent_token": null}}, "payment_method_types": ["card", "link"], "processing": null, "receipt_email": null, "review": null, "setup_future_usage": null, "shipping": null, "source": null, "statement_descriptor": null, "statement_descriptor_suffix": null, "status": "requires_payment_method", "transfer_data": null, "transfer_group": null}
[2024-12-20 09:43:00,047] [718038] [INFO] - Webhook call for 2d0239c9-5bd2-4d10-8c9d-3888b5c9a3c7 received!
[2024-12-20 09:43:00,135] [718044] [INFO] - Received webhook call for payment intent {"id": "pi_3Q...", "object": "payment_intent", "amount": 109, "amount_capturable": 0, "amount_details": {"tip": {}}, "amount_received": 0, "application": null, "application_fee_amount": null, "automatic_payment_methods": {"allow_redirects": "always", "enabled": true}, "canceled_at": null, "cancellation_reason": null, "capture_method": "automatic_async", "client_secret": "pi_3QY1nSG04wQ4kt1o0LDvgKp2_secret_6u9ZCdKZODCKfs5TswZDEDqcc", "confirmation_method": "automatic", "created": 1734684178, "currency": "usd", "customer": null, "description": null, "invoice": null, "last_payment_error": {"advice_code": "try_again_later", "charge": "ch_3QY1nSG04wQ4kt1o0mEz8YHB", "code": "card_declined", "decline_code": "generic_decline", "doc_url": "https://stripe.com/docs/error-codes/card-declined", "message": "Your card was declined.", "payment_method": {"id": "pm_1QY1nSG04wQ4kt1oFaoJxf8z", "object": "payment_method", "allow_redisplay": "unspecified", "billing_details": {"address": {"city": null, "country": null, "line1": null, "line2": null, "postal_code": null, "state": null}, "email": null, "name": null, "phone": null}, "card": {"brand": "visa", "checks": {"address_line1_check": null, "address_postal_code_check": null, "cvc_check": "pass"}, "country": "US", "display_brand": "visa", "exp_month": 12, "exp_year": 2025, "fingerprint": "HgmUUSMwiOzktMXB", "funding": "credit", "generated_from": null, "last4": "0002", "networks": {"available": ["visa"], "preferred": null}, "regulated_status": "unregulated", "three_d_secure_usage": {"supported": true}, "wallet": null}, "created": 1734684178, "customer": null, "livemode": false, "metadata": {}, "type": "card"}, "type": "card_error"}, "latest_charge": "ch_3QY1nSG04wQ4kt1o0mEz8YHB", "livemode": false, "metadata": {"restate_callback_id": "prom_1WwmuXpSfrCwBk-M7-JLlV6QcnWZ7nyKlAAAAAQ"}, "next_action": null, "on_behalf_of": null, "payment_method": null, "payment_method_configuration_details": {"id": "pmc_1QY1S3G04wQ4kt1oD2XuBNNT", "parent": null}, "payment_method_options": {"card": {"installments": null, "mandate_options": null, "network": null, "request_three_d_secure": "automatic"}, "link": {"persistent_token": null}}, "payment_method_types": ["card", "link"], "processing": null, "receipt_email": null, "review": null, "setup_future_usage": null, "shipping": null, "source": null, "statement_descriptor": null, "statement_descriptor_suffix": null, "status": "requires_payment_method", "transfer_data": null, "transfer_group": null}
```

A few notes:
* You would usually submit payment calls through Restate also with an idempotency token,
  like: ` -H 'idempotency-key: my-id-token'`
* The webhook setup with ngrok is not trivial and can easily be wrong. You might end up with
  some payments waiting for the webhooks. You can use the CLI to cancel them:
  `restate inv list` and `restate inv cancel <invocation_id>`.
* Here is an opportunity for the SAGAs pattern to cancel payments in that case.


</details>

## Transactional Event Processing
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/eventtransactions/user_feed.py)

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
3. Start the service: `python -m hypercorn --config hypercorn-config.toml src/eventtransactions/user_feed:app`
4. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`
5. Let Restate subscribe to the Kafka topic `social-media-posts` and invoke `UserFeed/processPost` on each message.
    ```shell
    curl localhost:9070/subscriptions -H 'content-type: application/json' \
    -d '{
        "source": "kafka://my-cluster/social-media-posts",
        "sink": "service://UserFeed/processPost",
        "options": {"auto.offset.reset": "earliest"}
    }'
    ```

6. Start a Kafka producer and send some messages to the `social-media-posts` topic:
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
You can see in the logs how events for different users are processed in parallel, but events for the same user are processed sequentially.

<details>
<summary>View logs</summary>

```shell
[2024-12-19 16:32:22,550] [694674] [INFO] - Created post d91524b2-843c-4bce-8bfa-662b75f4ad45 for user userid1 with content: Hi! This is my first post!
[2024-12-19 16:32:22,551] [694674] [INFO] - Content moderation for post d91524b2-843c-4bce-8bfa-662b75f4ad45 is still pending... Will check again in 5 seconds
[2024-12-19 16:32:24,720] [694678] [INFO] - Created post 56d5b415-65f5-4e24-9eb4-5565936e1426 for user userid2 with content: Hi! This is my first post!
[2024-12-19 16:32:24,722] [694678] [INFO] - Content moderation for post 56d5b415-65f5-4e24-9eb4-5565936e1426 is still pending... Will check again in 5 seconds
[2024-12-19 16:32:29,734] [694678] [INFO] - Content moderation for post 56d5b415-65f5-4e24-9eb4-5565936e1426 is still pending... Will check again in 5 seconds
[2024-12-19 16:32:32,571] [694674] [INFO] - Content moderation for post d91524b2-843c-4bce-8bfa-662b75f4ad45 is done
[2024-12-19 16:32:32,572] [694674] [INFO] - Updating the user feed for user userid1 with post d91524b2-843c-4bce-8bfa-662b75f4ad45
[2024-12-19 16:32:32,575] [694674] [INFO] - Created post b5b4a544-1b9d-4459-a3db-d4805853bb7f for user userid1 with content: Hi! This is my second post!
[2024-12-19 16:32:32,576] [694674] [INFO] - Content moderation for post b5b4a544-1b9d-4459-a3db-d4805853bb7f is still pending... Will check again in 5 seconds
[2024-12-19 16:32:37,587] [694674] [INFO] - Content moderation for post b5b4a544-1b9d-4459-a3db-d4805853bb7f is done
[2024-12-19 16:32:37,588] [694674] [INFO] - Updating the user feed for user userid1 with post b5b4a544-1b9d-4459-a3db-d4805853bb7f
[2024-12-19 16:32:39,760] [694678] [INFO] - Content moderation for post 56d5b415-65f5-4e24-9eb4-5565936e1426 is still pending... Will check again in 5 seconds
[2024-12-19 16:32:44,770] [694678] [INFO] - Content moderation for post 56d5b415-65f5-4e24-9eb4-5565936e1426 is still pending... Will check again in 5 seconds
[2024-12-19 16:33:59,900] [694678] [INFO] - Content moderation for post 56d5b415-65f5-4e24-9eb4-5565936e1426 is still pending... Will check again in 5 seconds
[2024-12-19 16:34:04,909] [694678] [INFO] - Content moderation for post 56d5b415-65f5-4e24-9eb4-5565936e1426 is done
[2024-12-19 16:34:04,911] [694678] [INFO] - Updating the user feed for user userid2 with post 56d5b415-65f5-4e24-9eb4-5565936e1426
```

As you see, slow events do not block other slow events.
Restate effectively created a queue per user ID.

The handler creates the social media post and waits for content moderation to finish.
If the moderation takes long, and there is an infrastructure crash, then Restate will trigger a retry.
The handler will fast-forward to where it was, will recover the post ID and will continue waiting for moderation to finish.

You can try it out by killing Restate or the service halfway through processing a post.

</details>
</details>

## Event Enrichment / Joins
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/eventenrichment/package_tracker.py)

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
3. Start the service: `python -m hypercorn --config hypercorn-config.toml src/eventenrichment/package_tracker:app`
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

6. Register a new package via the RPC handler:
    ```shell
    curl localhost:8080/package-tracker/package1/registerPackage \
      -H 'content-type: application/json' -d '{"final_destination": "Bridge 6, Amsterdam"}'
    ```

7. Start a Kafka producer and publish some messages to update the location of the package on the `package-location-updates` topic:
    ```shell
    docker exec -it broker kafka-console-producer --bootstrap-server broker:29092 --topic package-location-updates --property parse.key=true --property key.separator=:
    ```
    Send messages like
    ```
    package1:{"timestamp": "2024-10-10 13:00", "location": "Pinetree Road 5, Paris"}
    package1:{"timestamp": "2024-10-10 14:00", "location": "Mountain Road 155, Brussels"}
    ```

8. Query the package location via the RPC handler:
```shell
curl localhost:8080/package-tracker/package1/getPackageInfo
```
or via the CLI: `restate kv get package-tracker package1`

You can see how the state was enriched by the initial RPC event and the subsequent Kafka events:

<details>
<summary>Logs</summary>

```
🤖 State:
―――――――――

 Service  package-tracker
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

</details>
</details>
