/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import { userSessionApi, userSessionRouter } from "./user_session";
import { ticketDbApi, ticketDbRouter } from "./ticket_db";
import { checkoutApi, checkoutRouter } from "./checkout";

restate
  .createServer()
  .bindKeyedRouter(userSessionApi.path, userSessionRouter)
  .bindKeyedRouter(ticketDbApi.path, ticketDbRouter)
  .bindRouter(checkoutApi.path, checkoutRouter)
  .listen(8080);
