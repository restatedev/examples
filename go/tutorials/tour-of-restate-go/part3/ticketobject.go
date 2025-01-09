package main

import (
	"github.com/restatedev/examples/go/tutorials/tour-of-restate-go/auxiliary"
	restate "github.com/restatedev/sdk-go"
)

type TicketObject struct{}

// <start_reserve>
func (TicketObject) Reserve(ctx restate.ObjectContext) (bool, error) {
	status, err := restate.Get[auxiliary.TicketStatus](ctx, "status")
	if err != nil {
		return false, err
	}

	if status == auxiliary.TicketStatusAvailable {
		restate.Set(ctx, "status", auxiliary.TicketStatusReserved)
		return true, nil
	} else {
		return false, nil
	}
}

// <end_reserve>

// <start_unreserve>
func (TicketObject) Unreserve(ctx restate.ObjectContext) error {
	status, err := restate.Get[auxiliary.TicketStatus](ctx, "status")
	if err != nil {
		return err
	}

	if status != auxiliary.TicketStatusSold {
		restate.Clear(ctx, "status")
	}

	return nil
}

// <end_unreserve>

// <start_mark_as_sold>
func (TicketObject) MarkAsSold(ctx restate.ObjectContext) error {
	status, err := restate.Get[auxiliary.TicketStatus](ctx, "status")
	if err != nil {
		return err
	}

	if status == auxiliary.TicketStatusReserved {
		restate.Set(ctx, "status", auxiliary.TicketStatusSold)
	}

	return nil
}

// <end_mark_as_sold>
