/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

import * as restate from "@restatedev/restate-sdk/lambda";

const greet = async (_ctx: restate.Context, name: string) => {
  return `Hello, ${name ?? "Restate"}, from AWS Lambda!`;
};

// Create the Restate server to accept requests
export const handler = restate
  .endpoint()
  .bind(
    restate.service({
      name: "Greeter", // the service that serves the handlers
      handlers: { greet },
    }),
  )
  .handler();
