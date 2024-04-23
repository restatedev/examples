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

import dev.restate.sdk.lambda.BaseRestateLambdaHandler
import dev.restate.sdk.lambda.RestateLambdaEndpointBuilder

class LambdaHandler : BaseRestateLambdaHandler() {
    override fun register(builder: RestateLambdaEndpointBuilder) {
        builder.bind(Greeter())
    }
}
