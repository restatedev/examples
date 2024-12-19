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
package dev.restate.sdk.examples.clients

import org.apache.logging.log4j.LogManager
import org.apache.logging.log4j.Logger

object PaymentClient {
  private val logger: Logger = LogManager.getLogger(PaymentClient::class.java)

  fun charge(id: String?, token: String?, amount: Double): Boolean {
    logger.info(String.format("[%s] Executing payment with token %s for %.2f", id, token, amount))
    // ... do the call ...
    return true
  }
}
