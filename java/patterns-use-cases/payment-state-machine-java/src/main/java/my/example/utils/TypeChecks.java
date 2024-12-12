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
package my.example.utils;

import dev.restate.sdk.common.TerminalException;
import my.example.types.Payment;

public class TypeChecks {

  public static void validatePayment(Payment payment) {
    if (payment.getAccountId() == null || payment.getAccountId().isEmpty()) {
      throw new TerminalException("Account ID is required");
    }
    if (payment.getAmountCents() <= 0) {
      throw new TerminalException("Amount must be greater than 0");
    }
  }
}
