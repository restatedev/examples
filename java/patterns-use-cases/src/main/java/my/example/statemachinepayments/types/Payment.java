package my.example.statemachinepayments.types;

import dev.restate.sdk.common.TerminalException;

public class Payment {
  private final String accountId;
  private final long amountCents;

  public Payment(String accountId, long amountCents) {
    if (accountId == null || accountId.isEmpty()) {
      throw new TerminalException("Account ID is required");
    }
    if (amountCents <= 0) {
      throw new TerminalException("Amount must be greater than 0");
    }

    this.accountId = accountId;
    this.amountCents = amountCents;
  }

  public String getAccountId() {
    return accountId;
  }

  public long getAmountCents() {
    return amountCents;
  }
}
