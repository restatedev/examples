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
package my.example.accounts;

import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import my.example.types.Result;

//
// A simple virtual object, to track accounts.
// This is for simplicity to make this example work self-contained.
// This should be a database in a real scenario
//
@VirtualObject
public class Account {

  private static final StateKey<Long> BALANCE = StateKey.of("balance", JsonSerdes.LONG);

  @Handler
  public void deposit(ObjectContext ctx, Long amountCents) {
    if (amountCents <= 0) {
      throw new TerminalException("Amount must be greater than 0");
    }

    long balanceCents = ctx.get(BALANCE).orElse(initializeRandomAmount());
    ctx.set(BALANCE, balanceCents + amountCents);
  }

  @Handler
  public Result withdraw(ObjectContext ctx, Long amountCents) {
    if (amountCents <= 0) {
      throw new TerminalException("Amount must be greater than 0");
    }

    long balanceCents = ctx.get(BALANCE).orElse(initializeRandomAmount());
    if (balanceCents < amountCents) {
      return new Result(false, "Insufficient funds: " + balanceCents + " cents");
    }

    ctx.set(BALANCE, balanceCents - amountCents);
    return new Result(true, "Withdrawal successful");
  }

  private long initializeRandomAmount() {
    return (long) (Math.random() * 100_000 + 100_000);
  }
}
