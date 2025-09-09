package examples

import (
	"fmt"
	restate "github.com/restatedev/sdk-go"
	"time"

	"github.com/google/uuid"
)

func DayBefore(concertDate string) time.Duration {
	concertTime, err := time.Parse(time.RFC3339, concertDate)
	if err != nil {
		fmt.Printf("Error parsing concert date: %v\n", err)
		return 0
	}

	now := time.Now()
	delay := concertTime.Sub(now) - 24*time.Hour

	if delay < 0 {
		fmt.Println("Reminder date is in the past, cannot schedule reminder.")
		return 0
	}

	fmt.Printf("Scheduling reminder for %s with delay %v\n", concertDate, delay)
	return delay
}

func CreateRecurringPayment(creditCard, paymentId string) (string, error) {
	return fmt.Sprintf("payRef-%s", uuid.New().String()), nil
}

func RemoveRecurringPayment(paymentId string) (restate.Void, error) {
	fmt.Printf("Removing recurring payment: %s\n", paymentId)
	return restate.Void{}, nil
}

func failOnNetflix(subscription string) error {
	if subscription == "Netflix" {
		message := `[👻 SIMULATED] "Netflix subscription failed: Netflix API down..."`
		fmt.Println(message)
		return fmt.Errorf(message)
	}
	return nil
}

func terminalErrorOnDisney(subscription string) error {
	if subscription == "Disney" {
		message := `[👻 SIMULATED] "Disney subscription is not available in this region"`
		fmt.Println(message)
		return restate.TerminalError(fmt.Errorf(message))
	}
	return nil
}

// <start_subscription>
func CreateSubscription(userId, subscription, paymentRef string) (string, error) {
	if err := failOnNetflix(subscription); err != nil {
		return "", err
	}
	if err := terminalErrorOnDisney(subscription); err != nil {
		return "", err
	}
	fmt.Printf(">>> Created subscription %s for user %s\n", subscription, userId)
	return "SUCCESS", nil
}

// <end_subscription>

func RemoveSubscription(userId, subscription string) (restate.Void, error) {
	fmt.Printf("Removing subscription for user: %s, subscription: %s\n", userId, subscription)
	return restate.Void{}, nil
}

func InitPayment(req PaymentRequest, paymentId string, confirmationId string) (string, error) {
	fmt.Printf(">>> Initiating external payment %s\n", paymentId)
	fmt.Printf("  Confirm the payment via:\n")
	fmt.Printf("  - For Payments service: curl localhost:8080/Payments/Confirm --json '{\"id\": \"%s\", \"result\": {\"success\": true, \"transactionId\": \"txn-123\"}}'\n", confirmationId)
	fmt.Printf("  - For PaymentsWithTimeout service: curl localhost:8080/PaymentsWithTimeout/Confirm --json '{\"id\": \"%s\", \"result\": {\"success\": true, \"transactionId\": \"txn-123\"}}'\n", confirmationId)
	return fmt.Sprintf("payRef-%s", uuid.New().String()), nil
}

func CancelPayment(payRef string) (restate.Void, error) {
	fmt.Printf(">>> Canceling external payment with ref %s\n", payRef)
	return restate.Void{}, nil
}

type PaymentService struct{}

func (PaymentService) Charge(ctx restate.Context, req PurchaseTicketRequest) (string, error) {
	// Simulate payment processing
	paymentId := restate.Rand(ctx).UUID().String()
	fmt.Printf("Processing payment for ticket %s with payment ID %s\n", req.TicketId, paymentId)
	return paymentId, nil
}

type EmailService struct{}

func (EmailService) EmailTicket(ctx restate.Context, req PurchaseTicketRequest) error {
	fmt.Printf("Sending ticket to %s for concert on %s\n", req.CustomerEmail, req.ConcertDate)
	return nil
}

func (EmailService) SendReminder(ctx restate.Context, req PurchaseTicketRequest) error {
	fmt.Printf("Sending reminder for concert on %s to %s\n", req.ConcertDate, req.CustomerEmail)
	return nil
}
