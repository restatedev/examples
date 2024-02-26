# Restate Example: Durable Promises

The Durable Promises implemented in this example work like regular futures/promises,
but are durable cross processes and failures.

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

### Overview

The Durable Promises are a simple service implemented in two files:

* The [durable_promises_service.ts](src/dp/durable_promises_service.ts) file implements
  the service that backs the durable promise logic. It is primarily one state-backing
  Restate Virtual Object.
* [durable_promises.ts](src/dp/durable_promises.ts) has the interfaces for the typed
  TypeScript promise API that uses the Durable Service.

* The [simple example](src/1_example.ts) is a standalone process that uses a durable promise.
* The [parallel example](src/2_example_parallel.ts) runs the above example in multiple forks
  to illustrate concurrent use of the durable promises across processes.

### Run the example

Launch the Durable Promises Server
* Install the dependencies: `npm install`
* Start Restate in one shell: `npx restate-server` (or run via Docker or native binary)
* Start the Durable Promises implementation in another shell: `npm run promise-svc`
* Register Durable Promises service: `npx restate -y dep reg "localhost:9080"`

You can now await and resolve promises from different processes at different times.
With via simple HTTP calls or a TypeScript API.

**HTTP / curl:**

* **peek:** `curl localhost:8080/durablePromiseServer/peek -H 'content-type: application/json' -d '{ "request": { "promiseName": "prom-1" } }'`

* **await:** `curl localhost:8080/durablePromiseServer/await -H 'content-type: application/json' -d '{ "request": { "promiseName": "prom-1" } }'`

* **resolve:** `curl localhost:8080/durablePromiseServer/resolve -H 'content-type: application/json' -d '{ "request": { "promiseName": "prom-1", "value": { "name": "Barack", "email": "b@whitehouse.gov" } } }'`

* **reject:** `curl localhost:8080/durablePromiseServer/reject -H 'content-type: application/json' -d '{ "request": { "promiseName": "prom-1", "errorMessage": "help!" } }'`


**TypeScript/JavaScript Promise API**

The example programs illustrate how to use the durable promises from TypeScript/JavaScript:

`npm run example [promise-id] [restateUri]` instantiates a promise with the given id (or
a default id) and randomly either awaits or resolves it. Start multiple processes to see
how one resolution completes all listeners.

`npm run example-parallel [promise-id] [restateUri] [numParallel]` runs the above example in
parallel (default 10 times) to see the promises across processes in action.
