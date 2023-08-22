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
import { EmailSender, SendEmailRequest } from "./generated/proto/shoppingcart";
import { Empty } from "./generated/proto/google/protobuf/empty";
import { MailgunClient } from "./aux/mailgun_client";

export class EmailSvc implements EmailSender {
  private mailgunClient: MailgunClient;

  constructor() {
    this.mailgunClient = new MailgunClient();
  }

  async sendEmail(request: SendEmailRequest): Promise<Empty> {
    const ctx = restate.useContext(this);

    await ctx.sideEffect(async () =>
      this.mailgunClient.send(request.emailAddress, request.content)
    );

    return Empty.create();
  }
}
