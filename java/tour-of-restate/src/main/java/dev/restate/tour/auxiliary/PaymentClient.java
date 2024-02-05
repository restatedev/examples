/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Tour of Restate Java,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/tour-of-restate
 */

package dev.restate.tour.auxiliary;

public class PaymentClient {
    private static int i = 0;

    public static PaymentClient get() {
        return new PaymentClient();
    }

    public boolean call(String idempotencyKey, double amount) {
        System.out.println("Payment call succeeded for idempotency key " + idempotencyKey + " and amount " + amount);
        // do the call
        return true;
    }

    public boolean failingCall(String idempotencyKey, double amount) {
        if (i >= 2) {
            System.out.println("Payment call succeeded for idempotency key " + idempotencyKey + " and amount " + amount);
            i = 0;
            return true;
        } else {
            System.out.println("Payment call failed for idempotency key " + idempotencyKey + " and amount " + amount + ". Retrying...");
            i = i + 1;
            throw new IllegalStateException("Payment call failed");
        }
    }
}
