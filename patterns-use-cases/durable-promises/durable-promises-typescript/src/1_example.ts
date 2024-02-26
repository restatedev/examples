/*
 * Copyright (c) 2023-2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate SDK for Node.js/TypeScript,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in file LICENSE in the root
 * directory of this repository or package, or at
 * https://github.com/restatedev/sdk-typescript/blob/main/LICENSE
 */

import * as dp from "./dp/durable_promises"

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

const promiseId = process.argv.length > 2 ? process.argv[2] : "my-durable-promise-id";
const restateUri = process.argv.length > 3 ? process.argv[3] : "http://localhost:8080";
const pid = process.pid;

async function run() {
    // get a reference to a durable promise
    const durablePromise = dp.durablePromise<string>(restateUri, promiseId);

    // determine whether we'll be a reader or writer to the promise
    const resolve = Math.random() < 0.3;
    console.log(`${pid} will ${resolve ? "RESOLVE" : "AWAIT"} the promise`);

    // check the promise without blocking
    const peeked = await durablePromise.peek()
    console.log(`${pid} : Peek '${promiseId}' = '${peeked}'`);

    // resolve or listen, depending on our role
    if (resolve) {
        const resolveValue = `Completed by ${pid}`;
        console.log(`${pid} : Resolving '${promiseId}' to '${resolveValue}'`);
        const result = await durablePromise.resolve(resolveValue);
        console.log(`${pid} : '${promiseId}' actually resolved to '${result}'`);
    } else {
        console.log(`${pid} : Awaiting '${promiseId}'...`);
        const result = await durablePromise.get()
        console.log(`${pid} : Got result for '${promiseId}' = '${result}'`);
    }
}

run()
  .catch((err) => console.error(err?.message));
