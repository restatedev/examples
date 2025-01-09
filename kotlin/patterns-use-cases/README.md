# Kotlin Patterns and Use Cases

- **[Sagas](README.md#sagas)**: Preserve consistency by tracking undo actions and running them when code fails halfway through. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](src/main/kotlin/my/example/sagas/BookingWorkflow.kt)

## Sagas
[<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/show-code.svg">](src/main/kotlin/my/example/sagas/BookingWorkflow.kt)

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
2. Start the service: `./gradlew -PmainClass=my.example.sagas.BookingWorkflowKt run`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

Have a look at the logs to see how the compensations run in case of a terminal error.

Start the workflow:
```shell
curl -X POST localhost:8080/BookingWorkflow/trip12/run -H 'content-type: application/json' -d '{
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

<details>
<summary><strong>View logs</strong></summary>

```shell
2025-01-08 17:32:41 INFO  [BookingWorkflow/run][inv_17SdW8qEKwr73ZZA3arIY588qMXDUKWrWV] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2025-01-08 17:32:41 INFO  [Flights/reserve][inv_12Z8ramGNk1u3ZJGeQ6NHlO0k6NN5gGlod] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2025-01-08 17:32:41 INFO  [Flights/reserve][inv_12Z8ramGNk1u3ZJGeQ6NHlO0k6NN5gGlod] Flights - Flight reservation created with id: 96cf1dc6-8f53-10ab-9f06-8ed72a5fdb6b
2025-01-08 17:32:41 INFO  [Flights/reserve][inv_12Z8ramGNk1u3ZJGeQ6NHlO0k6NN5gGlod] dev.restate.sdk.core.InvocationStateMachine - End invocation
2025-01-08 17:32:41 INFO  [CarRentals/reserve][inv_1icvtYyBeb8U79Fihq1w37U4qOoVGsOjTP] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2025-01-08 17:32:41 INFO  [CarRentals/reserve][inv_1icvtYyBeb8U79Fihq1w37U4qOoVGsOjTP] CarRentals - Car rental reservation created with id: 69516bd0-e7f0-b00a-11bc-f7417bf213e7
2025-01-08 17:32:41 INFO  [CarRentals/reserve][inv_1icvtYyBeb8U79Fihq1w37U4qOoVGsOjTP] dev.restate.sdk.core.InvocationStateMachine - End invocation
2025-01-08 17:32:41 ERROR [BookingWorkflow/run][inv_17SdW8qEKwr73ZZA3arIY588qMXDUKWrWV] Payment - 👻 This payment should never be accepted! Aborting booking.
2025-01-08 17:32:41 INFO  [BookingWorkflow/run][inv_17SdW8qEKwr73ZZA3arIY588qMXDUKWrWV] Payment - Refunding payment with id: 75bb66f4-2e9a-a343-4946-670c8aad9d5f
2025-01-08 17:32:41 INFO  [CarRentals/cancel][inv_13YmJf8QG5763jivUYWwmplT2Z2ETlbUoV] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2025-01-08 17:32:41 INFO  [CarRentals/cancel][inv_13YmJf8QG5763jivUYWwmplT2Z2ETlbUoV] CarRentals - Car rental reservation cancelled with id: 69516bd0-e7f0-b00a-11bc-f7417bf213e7
2025-01-08 17:32:41 INFO  [CarRentals/cancel][inv_13YmJf8QG5763jivUYWwmplT2Z2ETlbUoV] dev.restate.sdk.core.InvocationStateMachine - End invocation
2025-01-08 17:32:41 INFO  [Flights/cancel][inv_11nr1pOn83Fm0OtWMLeCSrSCb7kPDBCdbz] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2025-01-08 17:32:41 INFO  [Flights/cancel][inv_11nr1pOn83Fm0OtWMLeCSrSCb7kPDBCdbz] Flights - Flight reservation cancelled with id: flight-b669b8e5-fb37-441a-af90-d3995ba43c0f
2025-01-08 17:32:41 INFO  [Flights/cancel][inv_11nr1pOn83Fm0OtWMLeCSrSCb7kPDBCdbz] dev.restate.sdk.core.InvocationStateMachine - End invocation
2025-01-08 17:32:41 WARN  [BookingWorkflow/run][inv_17SdW8qEKwr73ZZA3arIY588qMXDUKWrWV] dev.restate.sdk.core.ResolvedEndpointHandlerImpl - Error when processing the invocation
dev.restate.sdk.common.TerminalException: Failed to reserve the trip: 👻 Payment could not be accepted!. Ran 3 compensations.
...rest of trace...
2025-01-08 17:32:41 INFO  [BookingWorkflow/run][inv_17SdW8qEKwr73ZZA3arIY588qMXDUKWrWV] dev.restate.sdk.core.InvocationStateMachine - End invocation
```

</details>
</details>