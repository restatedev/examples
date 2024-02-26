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

// The standalone Durable Promises here work like regular futures/promises
// but are durable cross process and failures.

// ensures code runs to the end, even in the presence of
// failures. Use this for code that updates different systems and needs to
// make sure all updates are applied.
//
//  - Failures are automatically retried, unless they are explicitly labeled
//    as terminal errors
//  - Restate journals execution progress. Re-tries use that journal to replay
//    previous alread completed results, avoiding a repetition of that work and
//    ensuring stable deterministic values are used during execution.
//  - Durable executed functions use the regular code and control flow,
//    no custom DSLs
//

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
    console.error("Usage: <script> <restate-uri> <promiseId> <number of concurrent request>");
    process.exit(1);
}
const restateUri = args[0];
const promiseId = args[1];
const numRequests = parseInt(args[2], 10);
if (isNaN(numRequests) || numRequests < 1) {
    console.error("Please provide a valid number of actors.");
    process.exit(1);
}

// some resolve the promises, some await results
const numResolvers = Math.ceil(numRequests / 3);
console.log(`Running ${numResolvers} resolvers and ${numRequests - numResolvers} listeners`);

// the various listeners (await-ers) to the promise could be in different processes
for (let i = 0 ; i < numRequests - numResolvers; i++) {
    // here we get a durable promise - read side
    const durablePromise = dp.durablePromise<string>(restateUri, promiseId).get();

    console.log(`Listener [${i}] - awaiting promise...`);
    durablePromise
        .then((result) => console.log(`Listener [${i}] - RESOLVED: ${result}`))
        .catch((error) => console.log(`Listener [${i}] - REJECTED: ${error}`));
}

// create multiple resolvers - only one will actually resolve the promise
for (let i = 0 ; i < numResolvers; i++) {
    const durablePromise = dp.durablePromise<string>(restateUri, promiseId);

    // we resolve only after a delay with small random component, to show
    // how all resolvers race to the same value in the end
    const delay = 5000 + Math.floor(Math.random() * 20);
    setTimeout(() => {
        console.log(`Resolver [${i}] - Attempting to resolve`);
        const result = durablePromise.resolve(`Hello from resolver ${i} :-)!`);
        result
            .then((result) => console.log(`Resolver [${i}] - RESOLVED: ${result}`))
            .catch((error) => console.log(`Resolver [${i}] - REJECTED: ${error}`));
    }, delay);
}
