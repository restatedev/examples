package my.example.schedulingtasks

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.*
import dev.restate.sdk.kotlin.endpoint.endpoint
import kotlin.time.Duration.Companion.days

@VirtualObject
class PaymentTracker {

  companion object {
    private val PAID = stateKey<Boolean>("paid")
    private val REMINDER_COUNT = stateKey<Int>("reminder_count")
  }

  // Stripe sends us webhook events for invoice payment attempts
  @Handler
  suspend fun onPaymentSuccess(event: StripeEvent) {
    state().set(PAID, true)
  }

  @Handler
  suspend fun onPaymentFailure(event: StripeEvent) {
    val state = state()

    // Already paid, no need to send reminders
    if (state.get(PAID) == true) {
      return
    }

    val remindersCount = state.get(REMINDER_COUNT) ?: 0
    if (remindersCount < 3) {
      state.set(REMINDER_COUNT, remindersCount + 1)
      runBlock { sendReminderEmail(event) }

      // Schedule next reminder via a delayed self call
      toVirtualObject<PaymentTracker>(objectKey()).request { onPaymentFailure(event) }.send(1.days)
    } else {
      // After three reminders, escalate to support team
      runBlock { escalateToHuman(event) }
    }
  }
}

fun main() {
  RestateHttpServer.listen(endpoint { bind(PaymentTracker()) })
}
