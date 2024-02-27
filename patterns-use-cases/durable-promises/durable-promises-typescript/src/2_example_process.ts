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

// 
// An illustration of durable promises across processes.
//
// This example instantiates a promise and randomly either awaits it
// or completes it. Start this example multiple times in differnt shells,
// and see how this
//
// Run the example by calling `npm run example <promise-name> <restate-URI>`.
// This requires that you have Restate and the Durable Promises app running
// (`npm run promises`)
//

const promiseId = process.argv.length > 2 ? process.argv[2] : "my-example-2-id";
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
