package dev.restate.patterns.activities

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.kotlin.Context
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class PaymentRequest(val card: String)

@Service
class Payment {
    @Handler
    fun process(context: Context, request: PaymentRequest): String {
        // this should implement the actual payment processing, or communication
        // to the external provider's APIs
        // just return a mock random id representing the payment
        return UUID.randomUUID().toString();
    }

    @Handler
    fun refund(context: Context, paymentId: String) {
        // refund the payment identified by this paymentId
        // this should implement the actual payment processing, or communication
        // to the external provider's APIs
    }
}
