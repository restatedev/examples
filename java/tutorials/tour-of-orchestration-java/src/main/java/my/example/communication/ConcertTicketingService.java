package my.example.communication;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.auxiliary.types.PurchaseTicketRequest;

import static my.example.auxiliary.Utils.dayBefore;

@Service
public class ConcertTicketingService {

    @Handler
    public String buy(Context ctx, PurchaseTicketRequest req) {
        // Request-response call - wait for payment to complete
        String payRef = PaymentServiceClient.fromContext(ctx).charge(req).await();

        // One-way message - fire and forget ticket delivery
        EmailServiceClient.fromContext(ctx).send().emailTicket(req);

        // Delayed message - schedule reminder for day before concert
        EmailServiceClient.fromContext(ctx).send().sendReminder(req,
                dayBefore(req.concertDateTime()));

        return "Ticket purchased successfully with payment reference: " + payRef;
    }
}
