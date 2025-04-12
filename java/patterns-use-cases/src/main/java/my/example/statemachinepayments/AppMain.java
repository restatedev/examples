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
package my.example.statemachinepayments;

import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import my.example.statemachinepayments.accounts.Account;

public class AppMain {

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new Account()).bind(new PaymentProcessor()));
  }
}
