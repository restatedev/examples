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

## Running the examples

1. Install the dependencies: `npm install`.

2. Start Restate Server in a separate shell: `npx restate-server`

3. Start the service: `npm run app-dev`

4. Register the example at Restate server by calling
   `npx restate -y deployment register "localhost:9080"`.

## Demo scenario

Have a look at the logs to see how the compensations run in case of a terminal error.

Start the workflow:
```shell
curl -X POST localhost:8080/BookingWorkflow/trip123/run
```

Have a look at the logs to see the cancellations of the flight and car booking in case of a terminal error:
```shell
Flight 51e219f8-eb34-4384-a5ff-88607e89c220 reserved for trip trip123
Car 643e2aea-7576-403b-adc1-53b9c183ad83 reserved for trip trip123
This payment should never be accepted! Aborting booking.
Payment 619d5483-7eca-44ff-8b4d-a7fac5f444d3 refunded
Car 643e2aea-7576-403b-adc1-53b9c183ad83 cancelled for trip trip123
Flight 51e219f8-eb34-4384-a5ff-88607e89c220 cancelled for trip trip123
[restate] [BookingWorkflow/run][inv_10CFKeNWhtWx37Ao0Q9uQ0Oma0zlN6zs2J][2024-12-16T10:12:08.667Z] WARN:  Function completed with an error.
 TerminalError: This payment could not be accepted!
... rest of trace ...
```
