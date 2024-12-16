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

import {randomUUID} from "node:crypto";
import {TerminalError} from "@restatedev/restate-sdk";

export const payments = {
  process: async (request: { tripId: string }) => {
    if (Math.random() < 0.5) {
      console.error("This payment should never be accepted! Aborting booking.");
      throw new TerminalError("This payment could not be accepted!");
    }
    if (Math.random() < 0.8) {
      console.error("A payment failure happened! Will retry...");
      throw new Error("A payment failure happened! Will retry...");
    }
    const paymentId = randomUUID().toString();
    console.info(`Payment ${paymentId} processed for trip ${request.tripId}`);
    return paymentId;
  },

  refund: async (req: { paymentId: string }) => {
    console.info(`Payment ${req.paymentId} refunded`);
  },
};

