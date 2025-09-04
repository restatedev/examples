package shared

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

func DayBefore(concertDate string) time.Duration {
	return time.Minute
}

func CreateRecurringPayment(creditCard, paymentId string) (string, error) {
	return fmt.Sprintf("payRef-%s", uuid.New().String()), nil
}

func RemoveRecurringPayment(paymentId string) error {
	fmt.Printf("Removing recurring payment: %s\n", paymentId)
	return nil
}

func CreateSubscription(userId, subscription, paymentRef string) error {
	fmt.Printf("Creating subscription for user: %s, subscription: %s, paymentRef: %s\n", userId, subscription, paymentRef)
	return nil
}

func RemoveSubscription(userId, subscription string) error {
	fmt.Printf("Removing subscription for user: %s, subscription: %s\n", userId, subscription)
	return nil
}

func InitPayment(req PaymentRequest, paymentId string, confirmationId string) (string, error) {
	fmt.Printf(">>> Initiating external payment %s\n", paymentId)
	fmt.Printf("  Confirm the payment via:\n")
	fmt.Printf("  - For Payments service: curl localhost:8080/Payments/Confirm --json '{\"id\": \"%s\", \"result\": {\"success\": true, \"transactionId\": \"txn-123\"}}'\n", confirmationId)
	fmt.Printf("  - For PaymentsWithTimeout service: curl localhost:8080/PaymentsWithTimeout/Confirm --json '{\"id\": \"%s\", \"result\": {\"success\": true, \"transactionId\": \"txn-123\"}}'\n", confirmationId)
	return fmt.Sprintf("payRef-%s", uuid.New().String()), nil
}

func CancelPayment(payRef string) error {
	fmt.Printf(">>> Canceling external payment with ref %s\n", payRef)
	return nil
}
