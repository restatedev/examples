package timers

import (
	"time"

	"github.com/restatedev/sdk-go"

	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/shared"
)

type PaymentsWithTimeout struct{}

func (PaymentsWithTimeout) Process(ctx restate.Context, req shared.PaymentRequest) (shared.PaymentResult, error) {
	confirmation := restate.Awakeable[shared.PaymentResult](ctx)

	paymentId := restate.Rand(ctx).UUID().String()
	payRef, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return shared.InitPayment(req, paymentId, confirmation.Id())
	}, restate.WithName("pay"))
	if err != nil {
		return shared.PaymentResult{}, err
	}

	// Race between payment confirmation and timeout
	timeout := restate.After(ctx, 30*time.Second)
	selector := restate.Select(ctx, confirmation, timeout)

	switch selector.Select() {
	case confirmation:
		return confirmation.Result()
	default:
		if err := timeout.Done(); err != nil {
			return shared.PaymentResult{}, err
		}
		// Cancel the payment with external provider
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return shared.CancelPayment(payRef)
		}, restate.WithName("cancel-payment"))
		if err != nil {
			return shared.PaymentResult{}, err
		}

		return shared.PaymentResult{
			Success:      false,
			ErrorMessage: "Payment timeout",
		}, nil
	}
}

func (PaymentsWithTimeout) Confirm(ctx restate.Context, confirmation shared.ConfirmationRequest) error {
	restate.ResolveAwakeable(ctx, confirmation.Id, confirmation.Result)
	return nil
}
