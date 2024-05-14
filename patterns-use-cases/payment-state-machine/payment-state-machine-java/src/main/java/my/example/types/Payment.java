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
package my.example.types;

public class Payment {
    private final String accountId;
    private final long amountCents;

    public Payment(String accountId, long amountCents) {
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
