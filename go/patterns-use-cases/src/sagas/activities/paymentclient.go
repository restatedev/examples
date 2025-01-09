package activities

import (
	"errors"
	"fmt"
	restate "github.com/restatedev/sdk-go"
	"log/slog"
	"math/rand"
)

type PaymentInfo struct {
	CardNumber string  `json:"card_number"`
	Amount     float64 `json:"amount"`
}

type PaymentClient struct{}

func (PaymentClient) Charge(paymentId string, _paymentRequest PaymentInfo) error {
	if rand.Float64() < 0.5 {
		slog.Error("👻 This payment should never be accepted! Aborting booking.")
		return restate.TerminalError(errors.New("👻 this payment could not be accepted"))
	}
	if rand.Float64() < 0.8 {
		slog.Error("👻 A payment failure happened! Will retry...")
		return errors.New("👻 a payment failure happened! Will retry")
	}
	slog.Info(fmt.Sprintf("👻 Payment %s processed", paymentId))
	return nil
}

func (PaymentClient) Refund(paymentId string) error {
	slog.Info(`Refunded payment: ` + paymentId)
	return nil
}
