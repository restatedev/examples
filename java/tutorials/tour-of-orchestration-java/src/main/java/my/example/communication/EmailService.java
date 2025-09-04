package my.example.communication;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.auxiliary.types.PurchaseTicketRequest;

@Service
public class EmailService {

  @Handler
  public void emailTicket(Context ctx, PurchaseTicketRequest req) {
    System.out.printf(
        "Sending ticket to %s for concert on %s", req.customerEmail(), req.concertDate());
  }

  @Handler
  public void sendReminder(Context ctx, PurchaseTicketRequest req) {
    System.out.printf(
        "Sending reminder for concert on %s to %s", req.concertDate(), req.customerEmail());
  }
}
