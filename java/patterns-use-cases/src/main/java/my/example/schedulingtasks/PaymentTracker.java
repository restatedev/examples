package my.example.schedulingtasks;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import my.example.schedulingtasks.utils.StripeEvent;

import java.time.Duration;

import static dev.restate.sdk.JsonSerdes.BOOLEAN;
import static dev.restate.sdk.JsonSerdes.INT;
import static my.example.schedulingtasks.utils.Utils.escalateToHuman;
import static my.example.schedulingtasks.utils.Utils.sendReminderEmail;

@VirtualObject
public class PaymentTracker {

    StateKey<Boolean> PAID = StateKey.of("paid", BOOLEAN);
    StateKey<Integer> REMINDER_COUNT = StateKey.of("reminder_count", INT);

    // Stripe sends us webhook events for invoice payment attempts
    @Handler
    public void onPaymentSuccess(ObjectContext ctx, StripeEvent event) {
        ctx.set(PAID, true);
    }

    @Handler
    public void onPaymentFailure(ObjectContext ctx, StripeEvent event) {
        // Already paid, no need to send reminders
        if(ctx.get(PAID).orElse(false)) {
            return;
        }

        int remindersCount = ctx.get(REMINDER_COUNT).orElse(0);
        if (remindersCount < 3) {
            ctx.set(REMINDER_COUNT, remindersCount + 1);
            ctx.run(() -> sendReminderEmail(event));

            // Schedule next reminder via a delayed self call
            PaymentTrackerClient.fromContext(ctx, ctx.key())
                    .send(Duration.ofDays(1))
                    .onPaymentFailure(event);
        } else {
            // After three reminders, escalate to support team
            ctx.run(() -> escalateToHuman(event));
        }
    }

    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
                .bind(new PaymentTracker())
                .buildAndListen();
    }
}
