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

import * as restate from "@restatedev/restate-sdk";
import { durablePromiseObject, durablePromiseServer } from "./services";

// launch the server, if this is our main entry point
if (require.main === module) {
  const port = process.argv.length > 2 ? parseInt(process.argv[2]) : 9080;

  restate.endpoint().bind(durablePromiseObject).bind(durablePromiseServer).listen(port);
}
