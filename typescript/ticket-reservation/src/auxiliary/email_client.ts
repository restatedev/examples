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

export class EmailClient {
  public static get() {
    return new EmailClient();
  }

  public notifyUserOfPaymentSuccess(userId: string): boolean {
    console.log(`Notifying user ${userId} of payment success`);
    // send the email
    return true;
  }

  public notifyUserOfPaymentFailure(userId: string): boolean {
    console.log(`Notifying user ${userId} of payment failure`);
    // send the email
    return true;
  }
}
