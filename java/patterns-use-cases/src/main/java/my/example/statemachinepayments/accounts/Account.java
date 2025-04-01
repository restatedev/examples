package my.example.statemachinepayments.accounts;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.types.StateKey;
import dev.restate.sdk.types.TerminalException;
import my.example.statemachinepayments.types.Result;

//
// A simple virtual object, to track accounts.
// This is for simplicity to make this example work self-contained.
// This should be a database in a real scenario
//
@VirtualObject
public class Account {

  private static final StateKey<Long> BALANCE = StateKey.of("balance", Long.TYPE);

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
