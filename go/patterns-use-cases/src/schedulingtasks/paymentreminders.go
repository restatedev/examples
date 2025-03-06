package main

import (
	"context"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log"
	"time"
)

/*
* A service that manages recurring payments for subscriptions.
*
* Have a look at the onPaymentFailure handler to see how to schedule a task for later.
* The handler gets called by payment failure webhook events from the payment provider.
* It then starts a reminder loop to notify the user to update the payment method.
* After 3 reminders, the subscription is cancelled.
 */

type PaymentTracker struct{}

func (PaymentTracker) OnPaymentSuccess(ctx restate.ObjectContext, event StripeEvent) error {
	restate.Set(ctx, "paid", true)
	return nil
}

func (PaymentTracker) OnPaymentFailure(ctx restate.ObjectContext, event StripeEvent) error {
	paid, err := restate.Get[bool](ctx, "paid")
	if err != nil {
		return err
	}
	if paid {
		return nil
	}

	remindersCount, err := restate.Get[int](ctx, "reminders_count")
	print(remindersCount)
	if err != nil {
		return err
	}
	if remindersCount < 3 {
		restate.Set(ctx, "reminders_count", remindersCount+1)
		if _, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, SendReminderEmail(event)
		}); err != nil {
			return err
		}

		// Schedule next reminder via a delayed self call
		restate.ObjectSend(ctx,
			"PaymentTracker",
			restate.Key(ctx), // this object's invoice id
			"OnPaymentFailure").
			Send(event, restate.WithDelay(5*time.Second))
	} else {
		if _, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, EscalateToHuman(event)
		}); err != nil {
			return err
		}
	}
	return nil
}

func main() {
	if err := server.NewRestate().
		Bind(restate.Reflect(PaymentTracker{})).
		Start(context.Background(), ":9080"); err != nil {
		log.Fatal(err)
	}
}
