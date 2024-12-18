# Microservices: Sagas

An example of a trip reservation workflow, using the saga pattern to undo previous steps in case of an error.

Durable Execution's guarantee to run code to the end in the presence of failures, and to deterministically recover previous steps from the journal, makes sagas easy.
Every step pushes a compensation action (an undo operation) to a stack. In the case of an error, those operations are run.

The main requirement is that steps are implemented as journaled operations, like `ctx.run()` or RPC/messaging.

## Adding compensations
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

## Running the examples

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell:
   `restate-server`

2. Start the service: `./gradlew run`

3. Register the example at Restate server by calling
   `restate -y deployment register localhost:9080`

## Demo scenario

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