package examples

import (
	"time"

	"github.com/restatedev/sdk-go"
)

type PaymentsWithTimeout struct{}

func (PaymentsWithTimeout) Process(ctx restate.Context, req PaymentRequest) (PaymentResult, error) {
	confirmation := restate.Awakeable[PaymentResult](ctx)

	paymentId := restate.UUID(ctx).String()
	payRef, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return InitPayment(req, paymentId, confirmation.Id())
	}, restate.WithName("pay"))
	if err != nil {
		return PaymentResult{}, err
	}

	// Race between payment confirmation and timeout
	timeout := restate.After(ctx, 30*time.Second)
	resFut, err := restate.WaitFirst(ctx, confirmation, timeout)
	if err != nil {
		return PaymentResult{}, err
	}

	switch resFut {
	case confirmation:
		return confirmation.Result()
	default:
		if err := timeout.Done(); err != nil {
			return PaymentResult{}, err
		}
		// Cancel the payment with external provider
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return CancelPayment(payRef)
		}, restate.WithName("cancel-payment"))
		if err != nil {
			return PaymentResult{}, err
		}

		return PaymentResult{
			Success:      false,
			ErrorMessage: "Payment timeout",
		}, nil
	}
}

func (PaymentsWithTimeout) Confirm(ctx restate.Context, confirmation ConfirmationRequest) error {
	restate.ResolveAwakeable(ctx, confirmation.Id, confirmation.Result)
	return nil
}
