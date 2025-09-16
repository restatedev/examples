package my.example.sagas;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.common.TerminalException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import my.example.auxiliary.clients.PaymentClient;
import my.example.auxiliary.clients.SubscriptionClient;
import my.example.auxiliary.types.SubscriptionRequest;

@Service
public class SubscriptionSaga {

  @Handler
  public void add(Context ctx, SubscriptionRequest req) {
    List<Runnable> compensations = new ArrayList<>();
    try {
      var paymentId = ctx.random().nextUUID().toString();

      compensations.add(
          () -> ctx.run("undo-pay", () -> PaymentClient.removeRecurringPayment(paymentId)));
      String payRef =
          ctx.run(
              "pay",
              String.class,
              () -> PaymentClient.createRecurringPayment(req.creditCard(), paymentId));

      for (String subscription : req.subscriptions()) {
        compensations.add(
            () ->
                ctx.run(
                    "undo-" + subscription,
                    () -> SubscriptionClient.removeSubscription(req.userId(), subscription)));
        ctx.run(
            "add-" + subscription,
            () -> SubscriptionClient.createSubscription(req.userId(), subscription, payRef));
      }
    } catch (TerminalException e) {
      // Run compensations in reverse order
      Collections.reverse(compensations);
      for (Runnable compensation : compensations) {
        compensation.run();
      }
      throw e;
    }
  }
}
