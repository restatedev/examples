package dev.restate.sdk.examples

import dev.restate.sdk.lambda.BaseRestateLambdaHandler
import dev.restate.sdk.lambda.RestateLambdaEndpointBuilder

class LambdaHandler : BaseRestateLambdaHandler() {
    override fun register(builder: RestateLambdaEndpointBuilder) {
        builder.withService(Greeter())
    }
}
