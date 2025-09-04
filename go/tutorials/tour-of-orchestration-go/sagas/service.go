package sagas

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

// Mock function to remove recurring payment
func removeRecurringPayment(paymentId string) error {
	fmt.Printf("Removing recurring payment: %s\n", paymentId)
	return nil
}

// Mock function to create subscription
func createSubscription(userId, subscription, paymentRef string) error {
	fmt.Printf("Creating subscription for user: %s, subscription: %s, paymentRef: %s\n", userId, subscription, paymentRef)
	return nil
}

// Mock function to remove subscription
func removeSubscription(userId, subscription string) error {
	fmt.Printf("Removing subscription for user: %s, subscription: %s\n", userId, subscription)
	return nil
}

type SubscriptionSaga struct{}

func (SubscriptionSaga) Add(ctx restate.Context, req SubscriptionRequest) error {
	var compensations []func() error

	paymentId := ctx.Rand().UUID().String()

	// Add compensation for payment
	compensations = append(compensations, func() error {
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, removeRecurringPayment(paymentId)
		}, restate.WithName("undo-pay"))
		return err
	})

	// Create payment
	payRef, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return createRecurringPayment(req.CreditCard, paymentId)
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
				return restate.Void{}, removeSubscription(req.UserId, sub)
			}, restate.WithName(fmt.Sprintf("undo-%s", sub)))
			return err
		})

		// Create subscription
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, createSubscription(req.UserId, subscription, payRef)
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
