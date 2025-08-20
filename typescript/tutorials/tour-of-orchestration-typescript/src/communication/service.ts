import * as restate from "@restatedev/restate-sdk";
import {
  notificationService,
  paymentService,
  PurchaseTicketRequest,
} from "../utils";
import { rpc } from "@restatedev/restate-sdk";
import sendOpts = rpc.sendOpts;

export const concertTicketingService = restate.service({
  name: "ConcertTicketingService",
  handlers: {
    buy: async (
      ctx: restate.Context,
      req: PurchaseTicketRequest,
    ): Promise<string> => {
      // Request-response call - wait for payment to complete
      const paymentRef = await ctx
        .serviceClient(paymentService)
        .processPayment(req);

      // One-way message - fire and forget ticket delivery
      ctx.serviceSendClient(notificationService).emailTicket(req);

      // Delayed message - schedule reminder for day before concert
      const reminderDelay = req.millisUntilConcert - 24 * 60 * 60 * 1000; // 1 day in ms
      ctx
        .serviceSendClient(notificationService)
        .sendReminder(req, sendOpts({ delay: reminderDelay }));

      return `Ticket purchased successfully with payment reference: ${paymentRef}`;
    },
  },
});
