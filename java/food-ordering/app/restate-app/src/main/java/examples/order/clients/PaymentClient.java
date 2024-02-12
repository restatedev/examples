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

package examples.order.clients;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class PaymentClient {
  private static final Logger logger = LogManager.getLogger(PaymentClient.class);

  public static PaymentClient get() {
    return new PaymentClient();
  }

  public boolean charge(String id, String token, double amount) {
    logger.info(String.format("[%s] Executing payment with token %s for %.2f", id, token, amount));
    // ... do the call ...
    return true;
  }
}
