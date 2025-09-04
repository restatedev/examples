package getstarted

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

// Mock function to create recurring payment
func createRecurringPayment(creditCard, paymentId string) (string, error) {
	return fmt.Sprintf("payRef-%s", uuid.New().String()), nil
}

// Mock function to create subscription
func createSubscription(userId, subscription, paymentRef string) error {
	fmt.Printf("Creating subscription for user: %s, subscription: %s, paymentRef: %s\n", userId, subscription, paymentRef)
	return nil
}

type SubscriptionService struct{}

func (SubscriptionService) Add(ctx restate.Context, req SubscriptionRequest) error {
	paymentId := ctx.Rand().UUID().String()

	payRef, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return createRecurringPayment(req.CreditCard, paymentId)
	}, restate.WithName("pay"))
	if err != nil {
		return err
	}

	for _, subscription := range req.Subscriptions {
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, createSubscription(req.UserId, subscription, payRef)
		}, restate.WithName(fmt.Sprintf("add-%s", subscription)))
		if err != nil {
			return err
		}
	}

	return nil
}
