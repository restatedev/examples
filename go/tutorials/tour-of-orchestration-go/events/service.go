package events

import (
	"github.com/restatedev/sdk-go"

	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/shared"
)

type Payments struct{}

func (Payments) Process(ctx restate.Context, req shared.PaymentRequest) (shared.PaymentResult, error) {
	// Create awakeable to wait for webhook payment confirmation
	confirmation := restate.Awakeable[shared.PaymentResult](ctx)

	// Initiate payment with external provider (Stripe, PayPal, etc.)
	paymentId := restate.Rand(ctx).UUID().String()
	_, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return shared.InitPayment(req, paymentId, confirmation.Id())
	}, restate.WithName("pay"))
	if err != nil {
		return shared.PaymentResult{}, err
	}

	// Wait for external payment provider to call our webhook
	return confirmation.Result()
}

// Webhook handler called by external payment provider
func (Payments) Confirm(ctx restate.Context, confirmation shared.ConfirmationRequest) error {
	// Resolve the awakeable to continue the payment flow
	restate.ResolveAwakeable(ctx, confirmation.Id, confirmation.Result)
	return nil
}
