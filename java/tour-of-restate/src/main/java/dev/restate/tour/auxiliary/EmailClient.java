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

public class EmailClient {
    public static EmailClient get() {
        return new EmailClient();
    }

    public boolean notifyUserOfPaymentSuccess(String userId) {
        System.out.println("Notifying user " + userId + " of payment success");
        // send the email
        return true;
    }

    public boolean notifyUserOfPaymentFailure(String userId) {
        System.out.println("Notifying user " + userId + " of payment failure");
        // send the email
        return true;
    }
}