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

export class StripeClient {
  public static get() {
    return new StripeClient();
  }

  public call(
    idempotencyKey: string,
    paymentId: string,
    amount: number
  ): boolean {
    console.log(
      `Executing stripe call for idempotency key ${idempotencyKey} and amount ${amount}`
    );
    // do the call
    return true;
  }
}
