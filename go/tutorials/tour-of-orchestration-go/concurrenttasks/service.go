package concurrenttasks

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
)

type SubscriptionRequest struct {
	UserId        string   `json:"userId"`
	CreditCard    string   `json:"creditCard"`
	Subscriptions []string `json:"subscriptions"`
}

type SubscriptionResult struct {
	Success    bool   `json:"success"`
	PaymentRef string `json:"paymentRef"`
}

// Mock function to create recurring payment
func createRecurringPayment(creditCard, paymentId string) (string, error) {
	return fmt.Sprintf("payRef-%s", uuid.New().String()), nil
}

// Mock function to create subscription
func createSubscription(userId, subscription, paymentRef string) error {
	fmt.Printf("Creating subscription for user: %s, subscription: %s, paymentRef: %s\n", userId, subscription, paymentRef)
	return nil
}

type ParallelSubscriptionService struct{}

func (ParallelSubscriptionService) Add(ctx restate.Context, req SubscriptionRequest) (SubscriptionResult, error) {
	paymentId := ctx.Rand().UUID().String()

	payRef, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return createRecurringPayment(req.CreditCard, paymentId)
	}, restate.WithName("pay"))
	if err != nil {
		return SubscriptionResult{}, err
	}

	// Start all subscriptions in parallel using selectors
	var subscriptionSelectors []restate.Selector[restate.Void]
	for _, subscription := range req.Subscriptions {
		selector := restate.RunSelector(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, createSubscription(req.UserId, subscription, payRef)
		}, restate.WithName(fmt.Sprintf("add-%s", subscription)))
		subscriptionSelectors = append(subscriptionSelectors, selector)
	}

	// Wait for all subscriptions to complete
	for _, selector := range subscriptionSelectors {
		if _, err := selector.Result(); err != nil {
			return SubscriptionResult{}, err
		}
	}

	return SubscriptionResult{
		Success:    true,
		PaymentRef: payRef,
	}, nil
}
