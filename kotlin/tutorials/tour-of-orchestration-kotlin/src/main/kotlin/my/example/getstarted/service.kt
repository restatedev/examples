import dev.restate.sdk.Context
import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.endpoint
import java.util.*

data class SubscriptionRequest(
    val userId: String,
    val creditCard: String,
    val subscriptions: Array<String>
)

// Mock function to create recurring payment
suspend fun createRecurringPayment(creditCard: String, paymentId: String): String {
    return "payRef-${UUID.randomUUID()}"
}

// Mock function to create subscription
suspend fun createSubscription(userId: String, subscription: String, paymentRef: String) {
    println("Creating subscription for user: $userId, subscription: $subscription, paymentRef: $paymentRef")
}

@Service
class SubscriptionService {

    @Handler
    suspend fun add(ctx: Context, req: SubscriptionRequest) {
        val paymentId = ctx.random().nextUUID().toString()

        val payRef = ctx.runBlock(
            "pay",
            String::class
        ) {
            createRecurringPayment(req.creditCard, paymentId)
        }

        for (subscription in req.subscriptions) {
            ctx.runBlock("add-$subscription") {
                createSubscription(req.userId, subscription, payRef)
            }
        }
    }
}

fun main() {
    RestateHttpServer.listen(endpoint {
        bind(SubscriptionService())
    })
}