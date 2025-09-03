package my.example;

import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import my.example.communication.ConcertTicketingService;
import my.example.communication.PaymentService;
import my.example.concurrenttasks.ParallelSubscriptionService;
import my.example.events.Payments;
import my.example.getstarted.SubscriptionService;
import my.example.objects.UserSubscriptions;
import my.example.sagas.SubscriptionSaga;
import my.example.timers.PaymentsWithTimeoutService;

public class AppMain {
    public static void main(String[] args) {
        RestateHttpServer.listen(
                Endpoint.bind(new SubscriptionService())
                        .bind(new SubscriptionSaga())
                        .bind(new UserSubscriptions())
                        .bind(new ConcertTicketingService())
                        .bind(new Payments())
                        .bind(new PaymentsWithTimeoutService())
                        .bind(new ParallelSubscriptionService())
                        .bind(new PaymentService())

        );
    }
}
