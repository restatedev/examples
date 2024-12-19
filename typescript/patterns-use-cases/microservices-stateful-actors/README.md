# Microservices: Stateful Actors

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

## Running
1. Install the dependencies: `npm install`.

2. Start Restate Server in a separate shell: `npx restate-server`

3. Start the service: `npm run example`
   (Use `npm run example-crash` to use the variant that crashes the process and restarts, to see the state recovery happen).
 
4. Register the example at Restate server by calling
   `npx restate -y deployment register "localhost:9080"`.

## Demo scenario

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