package my.example.communication;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.auxiliary.types.PurchaseTicketRequest;

@Service
public class EmailService {

  @Handler
  public void emailTicket(Context ctx, PurchaseTicketRequest req) {
    System.out.println(
        "Sending ticket to " + req.customerEmail() + " for concert on " + req.concertDateTime());
  }

  @Handler
  public void sendReminder(Context ctx, PurchaseTicketRequest req) {
    System.out.println(
        "Sending reminder for concert on " + req.concertDateTime() + " to " + req.customerEmail());
  }
}
