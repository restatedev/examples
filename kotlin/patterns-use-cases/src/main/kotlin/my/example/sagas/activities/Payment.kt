package my.example.sagas.activities

import dev.restate.sdk.common.TerminalException
import kotlinx.serialization.Serializable
import org.apache.logging.log4j.LogManager

@Serializable
data class PaymentInfo(val cardNumber: String, val amount: Double)

private val logger = LogManager.getLogger("Payment")

fun chargeCustomer(request: PaymentInfo, paymentId: String) {
    // This should implement the actual payment processing, or communication
    // to the external provider's APIs.
    // Here, we just simulate payment failure to show how the compensations run.

    if (Math.random() < 0.5) {
        logger.error("👻 This payment should never be accepted! Aborting booking.");
        throw TerminalException("👻 Payment could not be accepted!");
    }

    if (Math.random() < 0.8) {
        logger.error("👻 A payment failure happened! Will retry...");
        throw RuntimeException("👻 A payment failure happened! Will retry...");
    }

    logger.info("Payment with id {} was successful!", paymentId);
}

fun refundCustomer(paymentId: String) {
    // refund the payment identified by this paymentId
    // this should implement the actual payment processing, or communication
    // to the external provider's APIs
    logger.info("Refunding payment with id: {}", paymentId);
}
