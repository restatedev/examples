import * as restate from "@restatedev/restate-sdk";
import {StripeEvent, PaymentTracker} from "./stubs";

const webhookCallbackRouter = restate.service({
    name : "WebhookCallbackRouter",
    handlers: {
        // Any handler can be a durable webhook processor that never loses events
        // You don't need to do anything special for this. Just point your webhook to the handler endpoint.
        onStripeEvent: async (ctx: restate.Context, event: StripeEvent) => {
            if (event.type === "invoice.payment_failed") {
                ctx.objectSendClient(PaymentTracker, event.data.object.id)
                    .onPaymentFailed(event);
            } else if (event.type === "invoice.payment_succeeded") {
                ctx.objectSendClient(PaymentTracker, event.data.object.id)
                    .onPaymentSuccess(event);
            }
        }
    }
})