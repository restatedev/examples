import * as dp from "./dp/clients";

// The Durable Promises work like regular futures/promises, but are
// durable cross processes and failures.
//
//  - A promise is uniquely identified by a name
//  - An arbitrary number of awaiters (listeners) across different
//    processes can await the promise.
//  - That promise can be resolved/rejected once. If multiple attempts
//    to resolve or reject are made, only the first will take effect. The
//    resolution is idempotent.
//
// The promises are a simple but expressive way to signal across distributed
// processes:
//
//  - Their idempotency on resolution guarantees a stable value
//  - Listeners can await the value for a long time, and retrieve the value
//    again after a failure/restart (await again, get the same value).
//  - The result is durable once set. Completer and listeners do not need to
//    be alive at the same time.
//  - It does not matter whether listener or completer comes first.

const promiseId = "my-durable-promise-id";
const restateUri = "http://localhost:8080";

async function run() {
  // get a reference to a durable promise
  const durablePromise = dp.durablePromise<string>(promiseId, restateUri);

  // check the promise without blocking
  const peeked = await durablePromise.peek();
  console.log("Peeked value: " + peeked);

  // awaiting the result
  const resultProm = durablePromise.get();
  resultProm.then((val) => console.log("Result value: " + val)).catch(console.error);

  // completing the promise. if we are the first to complete, the actual result
  // will be our completion value
  const actualResult = await durablePromise.resolve("This promise will notify everyone");
  console.log("Actual result after completing: " + actualResult);

  // this will never make it, because the promise is already completed
  const actualResult2 = await durablePromise.reject("Oh dear, rejected");
  console.log("Actual result after rejection: " + actualResult2);
}

run().catch((err) => console.error(err?.message));
