package auxiliary

import (
	"fmt"
	"log/slog"
)

type PaymentClient struct{}

func (PaymentClient) Call(idempotencyKey string, amount int) error {
	slog.Info("Payment call succeeded", "idempotencyKey", idempotencyKey, "amount", amount)

	return nil
}

var i = 0

func (PaymentClient) FailingCall(idempotencyKey string, amount int) error {
	if i >= 2 {
		slog.Info("Payment call succeeded", "idempotencyKey", idempotencyKey, "amount", amount)
		i = 0
		return nil
	} else {
		slog.Error("Payment call failed, retrying...", "idempotencyKey", idempotencyKey, "amount", amount)
		i++
		return fmt.Errorf("Payment call failed")
	}
}
