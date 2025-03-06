package my.example.schedulingtasks

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.*
import kotlin.time.Duration.Companion.days

@VirtualObject
class PaymentTracker {

    companion object {
        private val PAID = KtStateKey.json<Boolean>("paid")
        private val REMINDER_COUNT = KtStateKey.json<Int>("reminder_count")
    }

    // Stripe sends us webhook events for invoice payment attempts
    @Handler
    suspend fun onPaymentSuccess(ctx: ObjectContext, event: StripeEvent) {
        ctx.set(PAID, true)
    }

    @Handler
    suspend fun onPaymentFailure(ctx: ObjectContext, event: StripeEvent) {
        // Already paid, no need to send reminders
        if (ctx.get(PAID) == true) {
            return
        }

        val remindersCount = ctx.get(REMINDER_COUNT) ?: 0
        if (remindersCount < 3) {
            ctx.set(REMINDER_COUNT, remindersCount + 1)
            ctx.runBlock { sendReminderEmail(event) }

            // Schedule next reminder via a delayed self call
            PaymentTrackerClient.fromContext(ctx, ctx.key())
                    .send(1.days)
                    .onPaymentFailure(event)
        } else {
            // After three reminders, escalate to support team
            ctx.runBlock { escalateToHuman(event) }
        }
    }
}

fun main() {
    RestateHttpEndpointBuilder.builder().bind(PaymentTracker()).buildAndListen()
}
