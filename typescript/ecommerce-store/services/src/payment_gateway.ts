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
import {
  ChargeRequest,
  ChargeResponse,
  PaymentGateway,
} from "./generated/proto/shoppingcart";
import { StripeClient } from "./auxiliary/stripe_client";

export class PaymentGatewaySvc implements PaymentGateway {
  async charge(request: ChargeRequest): Promise<ChargeResponse> {
    const ctx = restate.useContext(this);

    const stripeClient = StripeClient.get();

    const success = await ctx.sideEffect(async () =>
      stripeClient.call(
        request.transactionId,
        request.paymentMethodIdentifier,
        request.amount
      )
    );

    return ChargeResponse.create({ success: success });
  }
}
