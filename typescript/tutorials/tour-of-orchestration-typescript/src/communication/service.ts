import * as restate from "@restatedev/restate-sdk";
import {
  dayBefore,
  emailService,
  paymentService,
  PurchaseTicketRequest,
} from "../utils";
import { rpc } from "@restatedev/restate-sdk";
import sendOpts = rpc.sendOpts;
import { Context } from "@restatedev/restate-sdk";

export const concertTicketingService = restate.service({
  name: "ConcertTicketingService",
  handlers: {
    buy: async (ctx: Context, req: PurchaseTicketRequest) => {
      // Request-response call - wait for payment to complete
      const payRef = await ctx.serviceClient(paymentService).charge(req);

      // One-way message - fire and forget ticket delivery
      ctx.serviceSendClient(emailService).emailTicket(req);

      // Delayed message - schedule reminder for day before concert
      ctx
        .serviceSendClient(emailService)
        .sendReminder(req, sendOpts({ delay: dayBefore(req.concertDate) }));

      return `Ticket purchased successfully with payment reference: ${payRef}`;
    },
  },
});
