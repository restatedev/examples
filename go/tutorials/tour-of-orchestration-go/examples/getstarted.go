package examples

import (
	"fmt"

	"github.com/restatedev/sdk-go"
)

type SubscriptionService struct{}

func (SubscriptionService) Add(ctx restate.Context, req SubscriptionRequest) error {
	paymentId := restate.Rand(ctx).UUID().String()

	payRef, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return CreateRecurringPayment(req.CreditCard, paymentId)
	}, restate.WithName("pay"))
	if err != nil {
		return err
	}

	for _, subscription := range req.Subscriptions {
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
			return CreateSubscription(req.UserId, subscription, payRef)
		}, restate.WithName(fmt.Sprintf("add-%s", subscription)))
		if err != nil {
			return err
		}
	}

	return nil
}
