# Restate Example: Durable Promises

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
use of Restate's Virtual Objects to consistently manage state, and of the Durable
Execution to allow awaiters (and their HTTP calls) to efficiently wait (and suspend
while waiting).

* The [durable_promises_service.ts](src/dp/durable_promises_service.ts) file implements
  the service that backs the durable promise logic. It is primarily one state-backing
  Restate Virtual Object.
* [durable_promises.ts](src/dp/durable_promises.ts) has the interfaces for the typed
  TypeScript promise API that uses the Durable Service.

You can even use this simple implementation and add it to your application or infra,
if you want.

### Running

* Install the dependencies: `npm install`
* Start Restate in one shell: `npx restate-server` (or run via Docker or native binary)
* Start the Durable Promises implementation in another shell: `npm run promises`
* Register Durable Promises service: `npx restate -y dep reg "localhost:9080" --force`

_Note: the '--force' flag here is to circumvent all checks relating to graceful upgrades,
because this here is only an example/playground, not a production setup._

You can now await and resolve promises from different processes at different times.
With via simple HTTP calls or a TypeScript API.

You can run the examples via `npm run example1`, `npm run example2`, `npm run example3`,
optionally passing `[promise-id] [restateUri]` as parameters.