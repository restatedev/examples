import dev.restate.sdk.Context
import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.endpoint
import java.util.*

data class PaymentRequest(
    val amount: Int,
    val currency: String,
    val customerId: String,
    val orderId: String
)

data class PaymentResult(
    val success: Boolean,
    val transactionId: String?,
    val errorMessage: String?
)

data class ConfirmationRequest(
    val id: String,
    val result: PaymentResult
)

// Mock function to initiate payment
suspend fun initPayment(req: PaymentRequest, paymentId: String): String {
    println(">>> Initiating external payment $paymentId")
    println("  Confirm the payment via:")
    println("  curl localhost:8080/Payments/confirm --json '{\"id\": \"$paymentId\", \"result\": {\"success\": true, \"transactionId\": \"txn-123\"}}'")
    return "payRef-${UUID.randomUUID()}"
}

@Service
class Payments {

    @Handler
    suspend fun process(ctx: Context, req: PaymentRequest): PaymentResult {
        // Create awakeable to wait for webhook payment confirmation
        val confirmation = ctx.awakeable(PaymentResult::class)

        // Initiate payment with external provider (Stripe, PayPal, etc.)
        ctx.runBlock("pay") {
            initPayment(req, confirmation.id)
        }

        // Wait for external payment provider to call our webhook
        return confirmation.await()
    }

    @Handler
    suspend fun confirm(ctx: Context, confirmation: ConfirmationRequest) {
        // Resolve the awakeable to continue the payment flow
        ctx.awakeableHandle(confirmation.id).resolve(PaymentResult::class, confirmation.result)
    }
}

fun main() {
    RestateHttpServer.listen(endpoint {
        bind(Payments())
    })
}