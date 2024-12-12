# Consistent State Machines

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

### Running

* Start Restate Server in a separate shell: `npx restate-server`
* Start this example: `npm run example`. (Use `npm run example-crash` to use the
  variant that crashes the process and restarts, to see the state recovery happen).
* Register the example at Restate server by calling `npx restate -y deployment register --force "localhost:9080"`.

Invoke the state machine transitions like
```shell
curl localhost:8080/resource/my-machine/setUp -H 'content-type: application/json' -d '' 
```

To illustrate the concurrency safety here, send multiple requests without waiting on
results and see how they play out sequentially per object (state machine).
Copy all the curl command lines below together and paste them to the terminal together.
You will see both from the later results (in the terminal with the curl commands) and in
the log of the NodeJs process that the requests queue per object key and safely execute
unaffected by crashes and recoveries.

```shell
(curl localhost:8080/resource/a/setUp    -H 'content-type: application/json' -d '' &)
(curl localhost:8080/resource/a/tearDown -H 'content-type: application/json' -d '' &)
(curl localhost:8080/resource/b/setUp    -H 'content-type: application/json' -d '' &)
(curl localhost:8080/resource/b/setUp    -H 'content-type: application/json' -d '' &)
(curl localhost:8080/resource/b/tearDown -H 'content-type: application/json' -d '' &)
echo "executing..."
```