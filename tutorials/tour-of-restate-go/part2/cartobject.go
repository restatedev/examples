package main

import (
	"time"

	restate "github.com/restatedev/sdk-go"
)

type CartObject struct{}

// <start_add_ticket>
func (CartObject) AddTicket(ctx restate.ObjectContext, ticketId string) (bool, error) {
	// withClass highlight-line
	reservationSuccess, err := restate.CallAs[bool](ctx.Object("TicketObject", ticketId, "Reserve")).Request(restate.Void{})
	if err != nil {
		return false, err
	}

	if reservationSuccess {
		// withClass highlight-line
		if err := ctx.Object("CartObject", ctx.Key(), "ExpireTicket").Send(ticketId, 15*time.Minute); err != nil {
			return false, err
		}
	}

	return reservationSuccess, nil
}

// <end_add_ticket>

// <start_checkout>
func (CartObject) Checkout(ctx restate.ObjectContext, _ restate.Void) (bool, error) {
	// withClass(1:2) highlight-line
	success, err := restate.CallAs[bool](ctx.Service("CheckoutService", "Handle")).
		Request(CheckoutRequest{UserId: ctx.Key(), Tickets: []string{"seat2B"}})
	if err != nil {
		return false, err
	}

	return success, nil
}

// <end_checkout>

// <start_expire_ticket>
func (CartObject) ExpireTicket(ctx restate.ObjectContext, ticketId string) (restate.Void, error) {
	// withClass highlight-line
	if err := ctx.Object("TicketObject", ticketId, "Unreserve").Send(restate.Void{}, 0); err != nil {
		return restate.Void{}, err
	}

	return restate.Void{}, nil
}

// <end_expire_ticket>
