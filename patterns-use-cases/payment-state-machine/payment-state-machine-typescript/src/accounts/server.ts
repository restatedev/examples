/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in file LICENSE in the root
 * directory of this repository or package, or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import handler from "./impl";

restate.endpoint().bind(handler).listen();