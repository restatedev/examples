package events

import (
	"fmt"
	"github.com/google/uuid"
	"github.com/restatedev/sdk-go"
)

type PaymentRequest struct {
	Amount     int    `json:"amount"`
	Currency   string `json:"currency"`
	CustomerId string `json:"customerId"`
	OrderId    string `json:"orderId"`
}

type PaymentResult struct {
	Success       bool   `json:"success"`
	TransactionId string `json:"transactionId,omitempty"`
	ErrorMessage  string `json:"errorMessage,omitempty"`
}

type ConfirmationRequest struct {
	Id     string        `json:"id"`
	Result PaymentResult `json:"result"`
}

// Mock function to initiate payment
func initPayment(req PaymentRequest, paymentId string) (string, error) {
	fmt.Printf(">>> Initiating external payment %s\n", paymentId)
	fmt.Printf("  Confirm the payment via:\n")
	fmt.Printf("  curl localhost:8080/Payments/Confirm --json '{\"id\": \"%s\", \"result\": {\"success\": true, \"transactionId\": \"txn-123\"}}'\n", paymentId)
	return fmt.Sprintf("payRef-%s", uuid.New().String()), nil
}

type Payments struct{}

func (Payments) Process(ctx restate.Context, req PaymentRequest) (PaymentResult, error) {
	// Create awakeable to wait for webhook payment confirmation
	confirmation := restate.Awakeable[PaymentResult](ctx)

	// Initiate payment with external provider (Stripe, PayPal, etc.)
	_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		_, err := initPayment(req, confirmation.Id())
		return restate.Void{}, err
	}, restate.WithName("pay"))
	if err != nil {
		return PaymentResult{}, err
	}

	// Wait for external payment provider to call our webhook
	result, err := confirmation.Result()
	if err != nil {
		return PaymentResult{}, err
	}

	return result, nil
}

// Webhook handler called by external payment provider
func (Payments) Confirm(ctx restate.Context, confirmation ConfirmationRequest) error {
	// Resolve the awakeable to continue the payment flow
	restate.ResolveAwakeable(ctx, confirmation.Id, confirmation.Result)
	return nil
}
