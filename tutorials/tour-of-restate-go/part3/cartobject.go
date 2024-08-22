package main

import (
	"slices"
	"time"

	restate "github.com/restatedev/sdk-go"
)

type CartObject struct{}

// <start_add_ticket>
func (CartObject) AddTicket(ctx restate.ObjectContext, ticketId string) (bool, error) {
	// withClass highlight-line
	reservationSuccess, err := restate.Object[bool](ctx, "TicketObject", ticketId, "Reserve").Request(restate.Void{})
	if err != nil {
		return false, err
	}

	if reservationSuccess {
		// withClass(1:6) highlight-line
		tickets, err := restate.Get[[]string](ctx, "tickets")
		if err != nil {
			return false, err
		}
		tickets = append(tickets, ticketId)
		restate.Set(ctx, "tickets", tickets)

		restate.ObjectSend(ctx, "CartObject", restate.Key(ctx), "ExpireTicket").Send(ticketId, restate.WithDelay(15*time.Minute))
	}

	return reservationSuccess, nil
}

// <end_add_ticket>

// <start_checkout>
func (CartObject) Checkout(ctx restate.ObjectContext) (bool, error) {
	// withClass(1:4) highlight-line
	tickets, err := restate.Get[[]string](ctx, "tickets")
	if err != nil || len(tickets) == 0 {
		return false, err
	}

	success, err := restate.Service[bool](ctx, "CheckoutService", "Handle").
		Request(CheckoutRequest{UserId: restate.Key(ctx), Tickets: []string{"seat2B"}})
	if err != nil {
		return false, err
	}

	if success {
		// withClass highlight-line
		restate.Clear(ctx, "tickets")
	}

	return success, nil
}

// <end_checkout>

// <start_expire_ticket>
func (CartObject) ExpireTicket(ctx restate.ObjectContext, ticketId string) error {
	tickets, err := restate.Get[[]string](ctx, "tickets")
	if err != nil {
		return err
	}
	ticketI := slices.Index(tickets, ticketId)

	if ticketI != -1 {
		tickets = slices.Delete(tickets, ticketI, ticketI+1)
		restate.Set(ctx, "tickets", tickets)

		restate.ObjectSend(ctx, "TicketObject", ticketId, "Unreserve").Send(restate.Void{})
	}

	return nil
}

// <end_expire_ticket>
