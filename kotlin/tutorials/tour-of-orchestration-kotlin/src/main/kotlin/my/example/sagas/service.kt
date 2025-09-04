import dev.restate.sdk.Context
import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.common.TerminalException
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

// Mock function to remove recurring payment
suspend fun removeRecurringPayment(paymentId: String) {
    println("Removing recurring payment: $paymentId")
}

// Mock function to create subscription
suspend fun createSubscription(userId: String, subscription: String, paymentRef: String) {
    println("Creating subscription for user: $userId, subscription: $subscription, paymentRef: $paymentRef")
}

// Mock function to remove subscription
suspend fun removeSubscription(userId: String, subscription: String) {
    println("Removing subscription for user: $userId, subscription: $subscription")
}

@Service
class SubscriptionSaga {

    @Handler
    suspend fun add(ctx: Context, req: SubscriptionRequest) {
        val compensations = mutableListOf<suspend () -> Unit>()
        
        try {
            val paymentId = ctx.random().nextUUID().toString()

            compensations.add {
                ctx.runBlock("undo-pay") { 
                    removeRecurringPayment(paymentId) 
                }
            }
            
            val payRef = ctx.runBlock(
                "pay",
                String::class
            ) {
                createRecurringPayment(req.creditCard, paymentId)
            }

            for (subscription in req.subscriptions) {
                compensations.add {
                    ctx.runBlock("undo-$subscription") {
                        removeSubscription(req.userId, subscription)
                    }
                }
                
                ctx.runBlock("add-$subscription") {
                    createSubscription(req.userId, subscription, payRef)
                }
            }
        } catch (e: TerminalException) {
            // Run compensations in reverse order
            for (compensation in compensations.reversed()) {
                compensation()
            }
            throw e
        }
    }
}

fun main() {
    RestateHttpServer.listen(endpoint {
        bind(SubscriptionSaga())
    })
}