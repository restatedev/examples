package my.example.concurrenttasks;

import static my.example.auxiliary.clients.PaymentClient.createRecurringPayment;
import static my.example.auxiliary.clients.SubscriptionClient.createSubscription;

import dev.restate.sdk.Context;
import dev.restate.sdk.DurableFuture;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import java.util.ArrayList;
import java.util.List;
import my.example.auxiliary.types.SubscriptionRequest;
import my.example.auxiliary.types.SubscriptionResult;

@Service
public class ParallelSubscriptionService {

  @Handler
  public SubscriptionResult add(Context ctx, SubscriptionRequest req) {
    var paymentId = ctx.random().nextUUID().toString();
    var payRef =
        ctx.run("pay", String.class, () -> createRecurringPayment(req.creditCard(), paymentId));

    // Start all subscriptions in parallel
    List<DurableFuture<?>> subscriptionFutures = new ArrayList<>();
    for (String subscription : req.subscriptions()) {
      subscriptionFutures.add(
          ctx.runAsync(
              "add-" + subscription, () -> createSubscription(req.userId(), subscription, payRef)));
    }

    // Wait for all subscriptions to complete
    DurableFuture.all(subscriptionFutures).await();

    return new SubscriptionResult(true, payRef);
  }
}
