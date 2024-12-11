package main

import (
	"github.com/restatedev/examples/tutorials/tour-of-restate-go/auxiliary"
	restate "github.com/restatedev/sdk-go"
)

type TicketObject struct{}

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
