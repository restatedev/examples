package my.example.communication;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.auxiliary.types.PurchaseTicketRequest;

@Service
public class PaymentService {

    @Handler
    public String charge(Context ctx, PurchaseTicketRequest req) {
        // Simulate payment processing
        String paymentId = ctx.random().nextUUID().toString();
        System.out.println(
                "Processing payment for ticket " + req.ticketId() +
                        " with payment ID " + paymentId);
        return paymentId;
    }
}
