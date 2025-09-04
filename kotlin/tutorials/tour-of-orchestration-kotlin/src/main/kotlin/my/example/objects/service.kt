import dev.restate.sdk.ObjectContext
import dev.restate.sdk.SharedObjectContext
import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Shared
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.common.StateKey
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.endpoint
import dev.restate.serde.TypeRef
import java.time.Instant

@VirtualObject
class UserSubscriptions {
    
    companion object {
        private val SUBSCRIPTIONS = StateKey.of("subscriptions", object : TypeRef<List<String>>() {})
        private val LAST_UPDATED = StateKey.of("lastUpdated", String::class.java)
    }

    @Handler
    suspend fun add(ctx: ObjectContext, subscription: String) {
        // Get current subscriptions
        val subscriptions = ctx.get(SUBSCRIPTIONS).orElse(emptyList()).toMutableList()

        // Add new subscription
        if (!subscriptions.contains(subscription)) {
            subscriptions.add(subscription)
        }
        ctx.set(SUBSCRIPTIONS, subscriptions)

        // Update metrics
        ctx.set(LAST_UPDATED, Instant.now().toString())
    }

    @Shared
    suspend fun getSubscriptions(ctx: SharedObjectContext): List<String> {
        return ctx.get(SUBSCRIPTIONS).orElse(emptyList())
    }
}

fun main() {
    RestateHttpServer.listen(endpoint {
        bind(UserSubscriptions())
    })
}