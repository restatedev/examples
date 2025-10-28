package webhookcallbacks

import restate "github.com/restatedev/sdk-go"

type StripeEvent struct {
	ID      string `json:"id"`
	Type    string `json:"type"`
	Created int64  `json:"created"`
	Data    struct {
		Object struct {
			ID       string `json:"id"`
			Customer string `json:"customer"`
		} `json:"object"`
	} `json:"data"`
}

// Have a look at the scheduling tasks example (../schedulingtasks/paymentreminders.go)
// to see a full implementation of this

type PaymentTracker struct{}

func (PaymentTracker) OnPaymentFailed(ctx restate.Context, event StripeEvent) error  { return nil }
func (PaymentTracker) OnPaymentSuccess(ctx restate.Context, event StripeEvent) error { return nil }
