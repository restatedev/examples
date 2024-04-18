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

import {endpoint} from "@restatedev/restate-sdk";

import session from "./user_session";
import tickets from "./ticket_db";
import checkout from "./checkout";

endpoint().bind(session).bind(tickets).bind(checkout).listen();
