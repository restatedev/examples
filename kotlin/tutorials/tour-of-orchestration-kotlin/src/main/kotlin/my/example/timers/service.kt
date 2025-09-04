import dev.restate.sdk.Context
import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.common.TimeoutException
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.endpoint
import java.time.Duration
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
    println("  curl localhost:8080/PaymentsWithTimeout/confirm --json '{\"id\": \"$paymentId\", \"result\": {\"success\": true, \"transactionId\": \"txn-123\"}}'")
    return "payRef-${UUID.randomUUID()}"
}

// Mock function to cancel payment
suspend fun cancelPayment(payRef: String) {
    println(">>> Canceling external payment with ref $payRef")
}

@Service
class PaymentsWithTimeout {

    @Handler
    suspend fun process(ctx: Context, req: PaymentRequest): PaymentResult {
        val confirmation = ctx.awakeable(PaymentResult::class)

        val payRef = ctx.runBlock(
            "pay",
            String::class
        ) {
            initPayment(req, confirmation.id)
        }

        return try {
            confirmation.await(Duration.ofSeconds(30))
        } catch (e: TimeoutException) {
            ctx.runBlock("cancel-payment") { 
                cancelPayment(payRef) 
            }
            PaymentResult(
                success = false,
                transactionId = null,
                errorMessage = "Payment timeout"
            )
        }
    }

    @Handler
    suspend fun confirm(ctx: Context, confirmation: ConfirmationRequest) {
        ctx.awakeableHandle(confirmation.id).resolve(PaymentResult::class, confirmation.result)
    }
}

fun main() {
    RestateHttpServer.listen(endpoint {
        bind(PaymentsWithTimeout())
    })
}