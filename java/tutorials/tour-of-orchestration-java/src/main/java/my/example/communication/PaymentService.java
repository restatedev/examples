package my.example.communication;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.auxiliary.types.PurchaseTicketRequest;

@Service
public class PaymentService {

  @Handler
  public String charge(PurchaseTicketRequest req) {
    // Simulate payment processing
    String paymentId = Restate.random().nextUUID().toString();
    System.out.printf(
        "Processing payment for ticket %s with payment ID %s", req.ticketId(), paymentId);
    return paymentId;
  }
}
