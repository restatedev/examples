package main

import restate "github.com/restatedev/sdk-go"

type WebhookCallbackRouter struct{}

// Any handler can be a durable webhook processor that never loses events
// You don't need to do anything special for this. Just point your webhook to the handler endpoint.

func (WebhookCallbackRouter) OnStripeEvent(ctx restate.Context, event StripeEvent) error {
	if event.Type == "invoice.payment_failed" {
		restate.ObjectSend(ctx, "PaymentTracker", "onPaymentFailed", event.Data.Object.ID).
			Send(event)
	} else if event.Type == "invoice.payment_succeeded" {
		restate.ObjectSend(ctx, "PaymentTracker", "onPaymentSuccess", event.Data.Object.ID).
			Send(event)
	}
	return nil
}
