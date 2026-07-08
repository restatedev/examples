package my.example.communication;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.auxiliary.types.PurchaseTicketRequest;

@Service
public class ConcertTicketingService {

  @Handler
  public String buy(PurchaseTicketRequest req) {
    // Request-response call - wait for payment to complete
    String payRef = Restate.service(PaymentService.class).charge(req);

    // One-way message - fire and forget ticket delivery
    Restate.serviceHandle(EmailService.class).send(EmailService::emailTicket, req);

    // Delayed message - schedule reminder for day before concert
    Restate.serviceHandle(EmailService.class)
        .send(EmailService::sendReminder, req, req.dayBefore());

    return "Ticket purchased successfully with payment reference: " + payRef;
  }
}
