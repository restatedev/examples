package dev.restate.sdk.examples

import dev.restate.sdk.lambda.LambdaRestateServer
import dev.restate.sdk.lambda.LambdaRestateServerFactory
import kotlinx.coroutines.Dispatchers

class LambdaFactory : LambdaRestateServerFactory {
    override fun create(): LambdaRestateServer {
        return LambdaRestateServer.builder().withService(Greeter(
                // Run coroutines on main thread
                coroutineContext = Dispatchers.Unconfined
        )).build()
    }
}
