import * as restate from "@restatedev/restate-sdk";
import {PaymentTracker, StripeEvent} from "./stubs";

const webhookCallbackRouter = restate.service({
    name : "WebhookCallbackRouter",
    handlers: {
        // Any handler can be a durable webhook processor that never loses events
        // You don't need to do anything special for this.
        // Just point your webhook to the handler endpoint: restate:8080/WebhookCallbackRouter/onStripeEvent
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

restate.endpoint().bind(webhookCallbackRouter).listen(9080);