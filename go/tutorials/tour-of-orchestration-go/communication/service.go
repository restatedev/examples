package communication

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
)

type PurchaseTicketRequest struct {
	TicketId        string  `json:"ticketId"`
	ConcertDateTime string  `json:"concertDateTime"`
	Price           float64 `json:"price"`
	CustomerEmail   string  `json:"customerEmail"`
}

// dayBefore calculates delay until day before concert
func dayBefore(concertDate string) time.Duration {
	// Parse concert date (simplified - in real implementation parse ISO format)
	// For this example, return 1 minute delay
	return time.Minute
}

type PaymentService struct{}

func (PaymentService) Charge(ctx restate.Context, req PurchaseTicketRequest) (string, error) {
	// Simulate payment processing
	paymentId := ctx.Rand().UUID().String()
	fmt.Printf("Processing payment for ticket %s with payment ID %s\n", req.TicketId, paymentId)
	return paymentId, nil
}

type EmailService struct{}

func (EmailService) EmailTicket(ctx restate.Context, req PurchaseTicketRequest) error {
	fmt.Printf("Sending ticket to %s for concert on %s\n", req.CustomerEmail, req.ConcertDateTime)
	return nil
}

func (EmailService) SendReminder(ctx restate.Context, req PurchaseTicketRequest) error {
	fmt.Printf("Sending reminder for concert on %s to %s\n", req.ConcertDateTime, req.CustomerEmail)
	return nil
}

type ConcertTicketingService struct{}

func (ConcertTicketingService) Buy(ctx restate.Context, req PurchaseTicketRequest) (string, error) {
	// Request-response call - wait for payment to complete
	payRef, err := restate.Service[PurchaseTicketRequest, string](ctx, "PaymentService", "Charge").Request(req)
	if err != nil {
		return "", err
	}

	// One-way message - fire and forget ticket delivery
	restate.Service[PurchaseTicketRequest, restate.Void](ctx, "EmailService", "EmailTicket").Send(req)

	// Delayed message - schedule reminder for day before concert
	delay := dayBefore(req.ConcertDateTime)
	restate.Service[PurchaseTicketRequest, restate.Void](ctx, "EmailService", "SendReminder").
		Send(req, restate.WithDelay(delay))

	return fmt.Sprintf("Ticket purchased successfully with payment reference: %s", payRef), nil
}
