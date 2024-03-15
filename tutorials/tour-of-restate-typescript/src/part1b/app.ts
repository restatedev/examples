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

import * as restate from "@restatedev/restate-sdk";
import { userSessionApi, userSessionRouter } from "./user_session";
import { ticketServiceApi, ticketDbRouter } from "./ticket_service";
import { checkoutApi, checkoutRouter } from "./checkout";

restate
  .endpoint()
  .bindKeyedRouter(userSessionApi.path, userSessionRouter)
  .bindKeyedRouter(ticketServiceApi.path, ticketDbRouter)
  .bindRouter(checkoutApi.path, checkoutRouter)
  .listen(9080);
