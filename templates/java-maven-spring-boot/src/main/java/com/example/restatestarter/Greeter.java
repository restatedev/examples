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

package com.example.restatestarter;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.springboot.RestateService;
import org.springframework.beans.factory.annotation.Value;

/**
 * Template of a Restate service and handler.
 */
@RestateService
public class Greeter {

  @Value("${greetingPrefix}")
  private String greetingPrefix;

  @Handler
  public String greet(Context ctx, String person) {
    return greetingPrefix + person;
  }

}
