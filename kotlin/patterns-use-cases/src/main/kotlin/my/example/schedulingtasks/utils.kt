package my.example.schedulingtasks

import kotlinx.serialization.Serializable
import org.apache.logging.log4j.LogManager

private val logger = LogManager.getLogger("PaymentTracker")

@Serializable
data class StripeEvent(
    val type: String,
    val created: Long,
    val data: StripeData,
)

@Serializable data class StripeData(val id: String, val customer: String)

fun sendReminderEmail(event: StripeEvent) {
  logger.info("Sending reminder email for event: ${event.data.id}")
}

fun escalateToHuman(event: StripeEvent) {
  logger.info("Escalating to ${event.data.id} invoice to support team")
}
