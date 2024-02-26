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

import { spawn } from "child_process";

const promiseId = process.argv.length > 2 ? process.argv[2] : "my-durable-promise-id";
const restateUri = process.argv.length > 3 ? process.argv[3] : "http://localhost:8080";
const numProcesses = process.argv.length > 4 ? Number(process.argv[4]) : 10;

// Function to execute an external script with the same stdout and stderr as the parent
function executeScript() {
    const args = ["run", "example", promiseId, restateUri];
    const child = spawn("npm", args, { stdio: "inherit" });

    return new Promise<void>((resolve, reject) => {
        child.on("close", (code) => {
            if (code !== 0) {
                console.error(`Script exited with code ${code}`);
                return reject(new Error(`Script exited with code ${code}`));
            }
            resolve();
        });
    });
}

// Main function to execute the script 10 times in parallel
async function main() {
    const promises = [];

    for (let i = 0; i < 10; i++) {
        promises.push(executeScript());
    }

    await Promise.all(promises);
    console.log("Done.");
}

main().catch(console.error);