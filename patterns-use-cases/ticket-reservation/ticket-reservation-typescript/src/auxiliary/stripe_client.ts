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

export class StripeClient {
  public static get() {
    return new StripeClient();
  }

  public async call(
    idempotencyKey: string,
    amount: number
  ): Promise<{ paymentSuccess: boolean }> {
    console.log(
      `Executing stripe call for idempotency key ${idempotencyKey} and amount ${amount}`
    );
    return { paymentSuccess: true };
  }
}
