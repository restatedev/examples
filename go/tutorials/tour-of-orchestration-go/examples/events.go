package examples

import (
	"github.com/restatedev/sdk-go"
)

type Payments struct{}

func (Payments) Process(ctx restate.Context, req PaymentRequest) (PaymentResult, error) {
	// Create awakeable to wait for webhook payment confirmation
	confirmation := restate.Awakeable[PaymentResult](ctx)

	// Initiate payment with external provider (Stripe, PayPal, etc.)
	paymentId := restate.Rand(ctx).UUID().String()
	_, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return InitPayment(req, paymentId, confirmation.Id())
	}, restate.WithName("pay"))
	if err != nil {
		return PaymentResult{}, err
	}

	// Wait for external payment provider to call our webhook
	return confirmation.Result()
}

// Webhook handler called by external payment provider
func (Payments) Confirm(ctx restate.Context, confirmation ConfirmationRequest) error {
	// Resolve the awakeable to continue the payment flow
	restate.ResolveAwakeable(ctx, confirmation.Id, confirmation.Result)
	return nil
}
