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

let i = 0;
export class PaymentClient {
  public static get() {
    return new PaymentClient();
  }
  async call(idempotencyKey: string, amount: number): Promise<boolean> {
    console.log(
      `Payment call succeeded for idempotency key ${idempotencyKey} and amount ${amount}`,
    );
    // do the call
    return true;
  }

  async failingCall(idempotencyKey: string, amount: number): Promise<boolean> {
    if (i >= 2) {
      console.log(
        `Payment call succeeded for idempotency key ${idempotencyKey} and amount ${amount}`,
      );
      i = 0;
      return true;
    } else {
      console.log(
        `Payment call failed for idempotency key ${idempotencyKey} and amount ${amount}. Retrying...`,
      );
      i = i + 1;
      throw new Error("Payment call failed");
    }
  }
}
