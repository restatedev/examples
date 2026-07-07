package my.example.getstarted;

import static my.example.auxiliary.clients.PaymentClient.createRecurringPayment;
import static my.example.auxiliary.clients.SubscriptionClient.createSubscription;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.auxiliary.types.SubscriptionRequest;

@Service
public class SubscriptionService {

  @Handler
  public void add(SubscriptionRequest req) {
    var paymentId = Restate.random().nextUUID().toString();

    String payRef =
        Restate.run("pay", String.class, () -> createRecurringPayment(req.creditCard(), paymentId));

    for (String subscription : req.subscriptions()) {
      Restate.run(
          "add-" + subscription, () -> createSubscription(req.userId(), subscription, payRef));
    }
  }
}
