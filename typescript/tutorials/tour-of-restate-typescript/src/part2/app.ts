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
import { cartObject } from "./cart_object";
import { ticketObject } from "./ticket_object";
import { checkoutService } from "./checkout_service";

restate.endpoint().bind(cartObject).bind(ticketObject).bind(checkoutService).listen();
