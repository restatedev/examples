package main

import (
	"github.com/restatedev/examples/go/tutorials/tour-of-restate-go/auxiliary"
	restate "github.com/restatedev/sdk-go"
)

// <start_checkout>
type CheckoutService struct{}

type CheckoutRequest struct {
	UserId  string   `json:"userId"`
	Tickets []string `json:"tickets"`
}

func (CheckoutService) Handle(ctx restate.Context, request CheckoutRequest) (bool, error) {
	totalPrice := len(request.Tickets) * 40

	idempotencyKey := restate.UUID(ctx).String()
	if _, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return restate.Void{}, auxiliary.PaymentClient{}.Call(idempotencyKey, totalPrice)
	}); err != nil {
		if _, err := restate.Run(ctx, func(ctx restate.RunContext) (bool, error) {
			return auxiliary.EmailClient{}.NotifyUserOfPaymentFailure(request.UserId)
		}); err != nil {
			return false, err
		}

		return false, nil
	}

	if _, err := restate.Run(ctx, func(ctx restate.RunContext) (bool, error) {
		return auxiliary.EmailClient{}.NotifyUserOfPaymentSuccess(request.UserId)
	}); err != nil {
		return false, err
	}

	return true, nil
}

// <end_checkout>
