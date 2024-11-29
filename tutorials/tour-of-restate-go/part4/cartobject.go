package main

import (
	"slices"
	"time"

	restate "github.com/restatedev/sdk-go"
)

type CartObject struct{}

func (CartObject) AddTicket(ctx restate.ObjectContext, ticketId string) (bool, error) {
	reservationSuccess, err := restate.Object[bool](ctx, "TicketObject", ticketId, "Reserve").Request(restate.Void{})
	if err != nil {
		return false, err
	}

	if reservationSuccess {
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

// <start_checkout>
func (CartObject) Checkout(ctx restate.ObjectContext) (bool, error) {
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
		// !mark(1:3)
		for _, ticketId := range tickets {
			restate.ObjectSend(ctx, "TicketObject", ticketId, "MarkAsSold").Send(restate.Void{})
		}
		restate.Clear(ctx, "tickets")
	}

	return success, nil
}

// <end_checkout>

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
