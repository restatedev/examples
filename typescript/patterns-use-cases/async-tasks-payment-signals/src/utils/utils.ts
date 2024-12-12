/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate SDK for Node.js/TypeScript,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in file LICENSE in the root
 * directory of this repository or package, or at
 * https://github.com/restatedev/sdk-typescript/blob/main/LICENSE
 */

import { TerminalError } from "@restatedev/restate-sdk";

export function verifyPaymentRequest(request: any): void {
  if (!request?.amount) {
    throw new TerminalError("'amount' missing or zero in request");
  }
  if (!request?.paymentMethodId) {
    throw new TerminalError("'paymentMethodId' missing in request");
  }
}
