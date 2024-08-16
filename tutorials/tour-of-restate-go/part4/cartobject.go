package main

import (
	"errors"
	"slices"
	"time"

	restate "github.com/restatedev/sdk-go"
)

type CartObject struct{}

func (CartObject) AddTicket(ctx restate.ObjectContext, ticketId string) (bool, error) {
	reservationSuccess, err := restate.CallAs[bool](ctx.Object("TicketObject", ticketId, "Reserve")).Request(restate.Void{})
	if err != nil {
		return false, err
	}

	if reservationSuccess {
		tickets, err := restate.GetAs[[]string](ctx, "tickets")
		if err != nil && !errors.Is(err, restate.ErrKeyNotFound) {
			return false, err
		}
		tickets = append(tickets, ticketId)
		if err := ctx.Set("tickets", tickets); err != nil {
			return false, err
		}

		if err := ctx.Object("CartObject", ctx.Key(), "ExpireTicket").Send(ticketId, 15*time.Minute); err != nil {
			return false, err
		}
	}

	return reservationSuccess, nil
}

// <start_checkout>
func (CartObject) Checkout(ctx restate.ObjectContext, _ restate.Void) (bool, error) {
	tickets, err := restate.GetAs[[]string](ctx, "tickets")
	if err != nil && !errors.Is(err, restate.ErrKeyNotFound) {
		return false, err
	}
	if len(tickets) == 0 {
		return false, nil
	}

	success, err := restate.CallAs[bool](ctx.Service("CheckoutService", "Handle")).
		Request(CheckoutRequest{UserId: ctx.Key(), Tickets: []string{"seat2B"}})
	if err != nil {
		return false, err
	}

	if success {
		// withClass(1:5) highlight-line
		for _, ticketId := range tickets {
			if err := ctx.Object("TicketObject", ticketId, "MarkAsSold").Send(restate.Void{}, 0); err != nil {
				return false, err
			}
		}
		ctx.Clear("tickets")
	}

	return success, nil
}

// <end_checkout>

func (CartObject) ExpireTicket(ctx restate.ObjectContext, ticketId string) (restate.Void, error) {
	tickets, err := restate.GetAs[[]string](ctx, "tickets")
	if err != nil && !errors.Is(err, restate.ErrKeyNotFound) {
		return restate.Void{}, err
	}
	ticketI := slices.Index(tickets, ticketId)

	if ticketI != -1 {
		tickets = slices.Delete(tickets, ticketI, ticketI+1)
		if err := ctx.Set("tickets", tickets); err != nil {
			return restate.Void{}, err
		}

		if err := ctx.Object("TicketObject", ticketId, "Unreserve").Send(restate.Void{}, 0); err != nil {
			return restate.Void{}, err
		}
	}

	return restate.Void{}, nil
}
