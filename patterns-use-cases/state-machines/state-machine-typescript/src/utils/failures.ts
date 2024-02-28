/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";

const killProcess: boolean = Boolean(process.env.CRASH_PROCESS);


export function maybeCrash(probability: number = 0.5): void {
  if (Math.random() < probability) {
    console.error("A failure happened!");

    if (killProcess) {
      console.error("--- CRASHING THE PROCESS ---");
      process.exit(1);
    } else {
      throw new Error("A failure happened!");
    }
  }
}

export function applicationError(probability: number, message: string): void {
  if (Math.random() < probability) {
    console.error("Action failed: " + message)
    throw new restate.TerminalError(message);
  }
}
