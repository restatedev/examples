package timers

import (
	"fmt"
	"time"

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
	fmt.Printf("  curl localhost:8080/PaymentsWithTimeout/Confirm --json '{\"id\": \"%s\", \"result\": {\"success\": true, \"transactionId\": \"txn-123\"}}'\n", paymentId)
	return fmt.Sprintf("payRef-%s", uuid.New().String()), nil
}

// Mock function to cancel payment
func cancelPayment(payRef string) error {
	fmt.Printf(">>> Canceling external payment with ref %s\n", payRef)
	return nil
}

type PaymentsWithTimeout struct{}

func (PaymentsWithTimeout) Process(ctx restate.Context, req PaymentRequest) (PaymentResult, error) {
	confirmation := restate.Awakeable[PaymentResult](ctx)

	payRef, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return initPayment(req, confirmation.Id())
	}, restate.WithName("pay"))
	if err != nil {
		return PaymentResult{}, err
	}

	// Race between payment confirmation and timeout
	timeout := restate.After(ctx, 30*time.Second)
	selector := restate.Select(ctx, confirmation, timeout)

	switch selector.Select() {
	case confirmation:
		result, err := confirmation.Result()
		if err != nil {
			return PaymentResult{}, err
		}
		return result, nil
	case timeout:
		if err := timeout.Done(); err != nil {
			return PaymentResult{}, err
		}
		// Cancel the payment with external provider
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, cancelPayment(payRef)
		}, restate.WithName("cancel-payment"))
		if err != nil {
			return PaymentResult{}, err
		}

		return PaymentResult{
			Success:      false,
			ErrorMessage: "Payment timeout",
		}, nil
	default:
		return PaymentResult{}, fmt.Errorf("unexpected selector result")
	}
}

func (PaymentsWithTimeout) Confirm(ctx restate.Context, confirmation ConfirmationRequest) error {
	restate.ResolveAwakeable(ctx, confirmation.Id, confirmation.Result)
	return nil
}
