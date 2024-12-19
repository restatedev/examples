# Microservices: Sagas

An example of a trip reservation workflow, using the saga pattern to
undo previous steps in case of an error.

Durable Execution's guarantee to run code to the end in the presence
of failures, and to deterministically recover previous steps from the
journal, makes sagas easy.
Every step pushes a compensation action (an undo operation) to a stack.
in the case of an error, those operations are run.

The main requirement is that steps are implemented as journald
operations, like `ctx.run()` or RPC/messaging.


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

1. Install the dependencies: `npm install`.

2. Start Restate Server in a separate shell: `npx restate-server`

3. Start the service: `npm run app-dev`

4. Register the example at Restate server by calling: 
   `npx restate -y deployment register localhost:9080`

## Demo scenario

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
