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

package dev.restate.sdk.examples

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.kotlin.Context

/**
 * Template of a Restate service and handler
 * Have a look at the Kotlin QuickStart to learn how to run this: https://docs.restate.dev/get_started/quickstart?sdk=kotlin
 */
@Service
class Greeter {

  @Handler
  suspend fun greet(ctx: Context, name: String): String {
    return "Hello, $name!"
  }
}
