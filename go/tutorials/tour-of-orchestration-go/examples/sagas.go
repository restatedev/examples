package examples

import (
	"fmt"
	"slices"

	"github.com/restatedev/sdk-go"
)

type SubscriptionSaga struct{}

func (SubscriptionSaga) Add(ctx restate.Context, req SubscriptionRequest) (err error) {
	var compensations []func() error

	// Run compensations at the end if err != nil
	defer func() {
		if err != nil {
			for _, compensation := range slices.Backward(compensations) {
				if compErr := compensation(); compErr != nil {
					err = compErr
				}
			}
		}
	}()

	paymentId := restate.UUID(ctx).String()

	// Add compensation for payment
	compensations = append(compensations, func() error {
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return RemoveRecurringPayment(paymentId)
		}, restate.WithName("undo-pay"))
		return err
	})

	// Create payment
	payRef, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return CreateRecurringPayment(req.CreditCard, paymentId)
	}, restate.WithName("pay"))
	if err != nil {
		return err
	}

	// Process subscriptions
	for _, subscription := range req.Subscriptions {
		// Add compensation for this subscription
		sub := subscription // Capture loop variable
		compensations = append(compensations, func() error {
			_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
				return RemoveSubscription(req.UserId, sub)
			}, restate.WithName(fmt.Sprintf("undo-%s", sub)))
			return err
		})

		// Create subscription
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
			return CreateSubscription(req.UserId, subscription, payRef)
		}, restate.WithName(fmt.Sprintf("add-%s", subscription)))
		if err != nil {
			return err
		}
	}

	return nil
}
