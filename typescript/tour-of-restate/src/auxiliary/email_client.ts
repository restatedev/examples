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

export class EmailClient {
  public static get() {
    return new EmailClient();
  }
  async notifyUserOfPaymentSuccess(userId: string): Promise<boolean> {
    console.log(`Notifying user ${userId} of payment success`);
    // send the email
    return true;
  }

  async notifyUserOfPaymentFailure(userId: string): Promise<boolean> {
    console.log(`Notifying user ${userId} of payment failure`);
    // send the email
    return true;
  }
}
