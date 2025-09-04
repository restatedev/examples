package communication

import (
	"fmt"
	"github.com/restatedev/sdk-go"

	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/shared"
)

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
