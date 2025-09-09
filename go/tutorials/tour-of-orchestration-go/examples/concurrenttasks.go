package examples

import (
	"fmt"

	"github.com/restatedev/sdk-go"
)

type ParallelSubscriptionService struct{}

func (ParallelSubscriptionService) Add(ctx restate.Context, req SubscriptionRequest) (SubscriptionResult, error) {
	paymentId := restate.Rand(ctx).UUID().String()

	payRef, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return CreateRecurringPayment(req.CreditCard, paymentId)
	}, restate.WithName("pay"))
	if err != nil {
		return SubscriptionResult{}, err
	}

	// Process all subscriptions sequentially
	var subscriptionFutures []restate.Selectable
	for _, subscription := range req.Subscriptions {
		future := restate.RunAsync(ctx, func(ctx restate.RunContext) (string, error) {
			return CreateSubscription(req.UserId, subscription, payRef)
		}, restate.WithName(fmt.Sprintf("add-%s", subscription)))
		subscriptionFutures = append(subscriptionFutures, future)
	}

	selector := restate.Select(ctx, subscriptionFutures...)

	for selector.Remaining() {
		_, err := selector.Select().(restate.RunAsyncFuture[string]).Result()
		if err != nil {
			return SubscriptionResult{}, err
		}
	}

	return SubscriptionResult{
		Success:    true,
		PaymentRef: payRef,
	}, nil
}
