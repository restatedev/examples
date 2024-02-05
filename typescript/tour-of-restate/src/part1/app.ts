/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Tour of Restate Typescript handler API,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/tour-of-restate
 */

import * as restate from "@restatedev/restate-sdk";
import { userSessionApi, userSessionRouter } from "./user_session";
import { ticketServiceApi, ticketDbRouter } from "./ticket_service";
import { checkoutApi, checkoutRouter } from "./checkout";

restate
  .createServer()
  .bindKeyedRouter(userSessionApi.path, userSessionRouter)
  .bindKeyedRouter(ticketServiceApi.path, ticketDbRouter)
  .bindRouter(checkoutApi.path, checkoutRouter)
  .listen(9080);
