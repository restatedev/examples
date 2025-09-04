package communication

import (
	"fmt"
	"github.com/restatedev/sdk-go"

	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/shared"
)

type PaymentService struct{}

func (PaymentService) Charge(ctx restate.Context, req shared.PurchaseTicketRequest) (string, error) {
	// Simulate payment processing
	paymentId := restate.Rand(ctx).UUID().String()
	fmt.Printf("Processing payment for ticket %s with payment ID %s\n", req.TicketId, paymentId)
	return paymentId, nil
}

type EmailService struct{}

func (EmailService) EmailTicket(ctx restate.Context, req shared.PurchaseTicketRequest) error {
	fmt.Printf("Sending ticket to %s for concert on %s\n", req.CustomerEmail, req.ConcertDate)
	return nil
}

func (EmailService) SendReminder(ctx restate.Context, req shared.PurchaseTicketRequest) error {
	fmt.Printf("Sending reminder for concert on %s to %s\n", req.ConcertDate, req.CustomerEmail)
	return nil
}

type ConcertTicketingService struct{}

func (ConcertTicketingService) Buy(ctx restate.Context, req shared.PurchaseTicketRequest) (string, error) {
	// Request-response call - wait for payment to complete
	payRef, err := restate.Service[string](ctx, "PaymentService", "Charge").Request(req)
	if err != nil {
		return "", err
	}

	// One-way message - fire and forget ticket delivery
	restate.Service[restate.Void](ctx, "EmailService", "EmailTicket").Send(req)

	// Delayed message - schedule reminder for day before concert
	delay := shared.DayBefore(req.ConcertDate)
	restate.Service[restate.Void](ctx, "EmailService", "SendReminder").
		Send(req, restate.WithDelay(delay))

	return fmt.Sprintf("Ticket purchased successfully with payment reference: %s", payRef), nil
}
