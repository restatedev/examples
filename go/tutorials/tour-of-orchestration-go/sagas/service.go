package sagas

import (
	"fmt"

	"github.com/restatedev/sdk-go"

	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/shared"
)


type SubscriptionSaga struct{}

func (SubscriptionSaga) Add(ctx restate.Context, req shared.SubscriptionRequest) error {
	var compensations []func() error

	paymentId := restate.Rand(ctx).UUID().String()

	// Add compensation for payment
	compensations = append(compensations, func() error {
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, shared.RemoveRecurringPayment(paymentId)
		}, restate.WithName("undo-pay"))
		return err
	})

	// Create payment
	payRef, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return shared.CreateRecurringPayment(req.CreditCard, paymentId)
	}, restate.WithName("pay"))
	if err != nil {
		// Run compensations on failure
		for i := len(compensations) - 1; i >= 0; i-- {
			compensations[i]()
		}
		return err
	}

	// Process subscriptions
	for _, subscription := range req.Subscriptions {
		// Add compensation for this subscription
		sub := subscription // Capture loop variable
		compensations = append(compensations, func() error {
			_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
				return restate.Void{}, shared.RemoveSubscription(req.UserId, sub)
			}, restate.WithName(fmt.Sprintf("undo-%s", sub)))
			return err
		})

		// Create subscription
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, shared.CreateSubscription(req.UserId, subscription, payRef)
		}, restate.WithName(fmt.Sprintf("add-%s", subscription)))
		if err != nil {
			// Run compensations in reverse order on failure
			for i := len(compensations) - 1; i >= 0; i-- {
				compensations[i]()
			}
			return err
		}
	}

	return nil
}
