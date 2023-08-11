import * as restate from "@restatedev/restate-sdk";
import { v4 as uuid } from "uuid";
import { StripeClient } from "./aux/stripe_client";
import { EmailClient } from "./aux/email_client";

const doCheckout = async (
  ctx: restate.RpcContext,
  request: { userId: string; tickets: string[] },
) => {
  // We are a uniform shop where everything costs 40 USD
  const totalPrice = request.tickets.length * 40;

  // Generate idempotency key for the stripe client
  const idempotencyKey = await ctx.sideEffect(async () => uuid());
  const stripe = StripeClient.get();

  const doPayment = async () => stripe.call(idempotencyKey, totalPrice);
  const success = await ctx.sideEffect(doPayment);

  const email = EmailClient.get();

  if (success) {
    console.info("Payment successful. Notifying user about shipment.");
    await ctx.sideEffect(async () =>
      email.notifyUserOfPaymentSuccess(request.userId),
    );
  } else {
    console.info("Payment failure. Notifying user about it.");
    await ctx.sideEffect(async () =>
      email.notifyUserOfPaymentFailure(request.userId),
    );
  }

  return success;
};

export const checkoutApi: restate.ServiceApi<typeof checkoutRouter> = {
  path: "checkoutProcess",
};
export const checkoutRouter = restate.router({
  checkout: doCheckout,
});
