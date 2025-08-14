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
import { PaymentClient } from "../auxiliary/payment_client";

export const checkoutService = restate.service({
  name: "CheckoutService",
  handlers: {
    async handle(ctx: restate.Context, request: { userId: string; tickets: string[] }) {
      return true;
    },
  },
});

export const CheckoutService: typeof checkoutService = { name: "CheckoutService" };
