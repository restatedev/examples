package utils

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.kotlin.*

@VirtualObject
class SubscriptionService {

    @Handler
    fun create(userId: String): String =
        "SUCCESS"

    @Handler
    suspend fun cancel() =
        println("Cancelling all subscriptions for user ${objectKey()}")
}
