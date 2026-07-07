package my.example.schedulingtasks;

import static my.example.schedulingtasks.utils.Utils.escalateToHuman;
import static my.example.schedulingtasks.utils.Utils.sendReminderEmail;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import java.time.Duration;
import my.example.schedulingtasks.utils.StripeEvent;

@VirtualObject
public class PaymentTracker {

  private static final StateKey<Boolean> PAID = StateKey.of("paid", Boolean.TYPE);
  private static final StateKey<Integer> REMINDER_COUNT =
      StateKey.of("reminder_count", Integer.TYPE);

  // Stripe sends us webhook events for invoice payment attempts
  @Handler
  public void onPaymentSuccess(StripeEvent event) {
    Restate.state().set(PAID, true);
  }

  @Handler
  public void onPaymentFailure(StripeEvent event) {
    var state = Restate.state();

    // Already paid, no need to send reminders
    if (state.get(PAID).orElse(false)) {
      return;
    }

    int remindersCount = state.get(REMINDER_COUNT).orElse(0);
    if (remindersCount < 3) {
      state.set(REMINDER_COUNT, remindersCount + 1);
      Restate.run("send reminder", () -> sendReminderEmail(event));

      // Schedule next reminder via a delayed self call
      Restate.virtualObjectHandle(PaymentTracker.class, Restate.key())
          .send(PaymentTracker::onPaymentFailure, event, Duration.ofDays(1));
    } else {
      // After three reminders, escalate to support team
      Restate.run("escalate", () -> escalateToHuman(event));
    }
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new PaymentTracker()));
  }
}
