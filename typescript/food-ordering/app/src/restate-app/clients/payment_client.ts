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

class PaymentClient {
  async reserve(id: string, token: string, amount: number): Promise<boolean> {
    console.info(
      `[${id}] Reserving payment with token ${token} for $${amount}`
    );
    // do the call
    return true;
  }

  async unreserve(id: string, token: string, amount: number): Promise<boolean> {
    console.info(
      `[${id}] Unreserving payment with token ${token} for $${amount}`
    );
    // do the call
    return true;
  }

  async charge(id: string, token: string, amount: number): Promise<boolean> {
    console.info(
      `[${id}] Executing payment with token ${token} for $${amount}`
    );
    // do the call
    return true;
  }
}

export function getPaymentClient() {
  return new PaymentClient();
}
