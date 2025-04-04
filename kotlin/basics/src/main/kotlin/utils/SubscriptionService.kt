package utils

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.kotlin.ObjectContext

@VirtualObject
class SubscriptionService {

    @Handler
    fun create(ctx: ObjectContext, userId: String): String =
        "SUCCESS"

    @Handler
    fun cancel(ctx: ObjectContext) =
        println("Cancelling all subscriptions for user ${ctx.key()}")
}