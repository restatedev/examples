package my.example.schedulingtasks

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.KtStateKey
import dev.restate.sdk.kotlin.ObjectContext
import dev.restate.sdk.kotlin.runBlock
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.seconds


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

    // <mark_1>
    @Handler
    suspend fun onPaymentFailure(ctx: ObjectContext, event: StripeEvent) {
        if(ctx.get(PAID) == true) {
            return
        }

        val remindersCount = ctx.get(REMINDER_COUNT) ?: 0
        if(remindersCount < 3) {
            ctx.set(REMINDER_COUNT, remindersCount + 1)
            ctx.runBlock { sendReminderEmail(event) }

            // Schedule next reminder via a delayed self call
            PaymentTrackerClient.fromContext(ctx, ctx.key())
                    .send(1.seconds)
                    .onPaymentFailure(event)
        } else {
            ctx.runBlock { escalateToHuman(event) }
        }
    }
}
// <end_here>

fun main() {
    RestateHttpEndpointBuilder.builder().bind(PaymentTracker()).buildAndListen()
}
