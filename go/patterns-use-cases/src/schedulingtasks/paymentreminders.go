package main

import (
	"context"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log/slog"
	"os"
	"time"
)

const MAX_REMINDERS = 3
const REMINDER_INTERVAL = 24 * 60 * 60 * time.Millisecond

/*
* A service that manages recurring payments for subscriptions.
*
* Have a look at the onPaymentFailure handler to see how to schedule a task for later.
* The handler gets called by payment failure webhook events from the payment provider.
* It then starts a reminder loop to notify the user to update the payment method.
* After 3 reminders, the subscription is cancelled.
 */

type PaymentTracker struct{}

// Schedule recurrent tasks with delayed self calls

func (PaymentTracker) RemindPaymentFailed(ctx restate.ObjectContext, event StripeEvent) error {
	status, err := restate.Get[string](ctx, "status")
	if err != nil {
		return err
	}

	// Stop the loop if the payment was successful in the meantime
	// This value gets stored in state by the onPaymentSuccess handler and can be queried from outside
	if status == "PAID" {
		restate.Clear(ctx, "reminders_count")
		return nil
	}

	// Otherwise, sent up to 3 reminders (via delayed self calls) and then escalate to the support team
	remindersCount, err := restate.Get[int](ctx, "reminders_count")
	if err != nil {
		return err
	}
	if remindersCount >= MAX_REMINDERS {
		// Escalate to support
		restate.ObjectSend(ctx, "PaymentTracker", "Escalate", restate.Key(ctx)).Send(event)
		restate.Set[string](ctx, "status", "FAILED_ESCALATED")
		return nil
	}

	err = sendEmail("Payment failed. Re-execute the payment within " + string(rune(3-remindersCount)) + " days.")
	if err != nil {
		return err
	}
	restate.Set(ctx, "reminders_count", remindersCount+1)
	restate.Set(ctx, "status", "FAILED")

	// DELAYED CALL: Schedule the next reminder
	restate.ObjectSend(ctx, "PaymentTracker", "RemindPaymentFailed", restate.Key(ctx)).
		Send(event, restate.WithDelay(REMINDER_INTERVAL))
	return nil
}

func (PaymentTracker) OnPaymentSuccess(ctx restate.ObjectContext, event StripeEvent) error {
	// Mark the invoice as paid
	restate.Set(ctx, "status", "PAID")
	return nil
}

func (PaymentTracker) Escalate(ctx restate.ObjectContext, event StripeEvent) error {
	// Request human intervention to resolve the issue.
	return nil
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(PaymentTracker{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}
