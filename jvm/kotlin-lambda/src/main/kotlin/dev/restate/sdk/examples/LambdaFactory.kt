package dev.restate.sdk.examples

import dev.restate.sdk.lambda.LambdaRestateServer
import dev.restate.sdk.lambda.LambdaRestateServerFactory

class LambdaFactory : LambdaRestateServerFactory {
    override fun create(): LambdaRestateServer {
        return LambdaRestateServer.builder().withService(Greeter()).build()
    }
}
