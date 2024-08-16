package main

import (
	"errors"

	"github.com/restatedev/examples/tutorials/tour-of-restate-go/auxiliary"
	restate "github.com/restatedev/sdk-go"
)

type TicketObject struct{}

// <start_reserve>
func (TicketObject) Reserve(ctx restate.ObjectContext, _ restate.Void) (bool, error) {
	status, err := restate.GetAs[auxiliary.TicketStatus](ctx, "status")
	if err != nil && !errors.Is(err, restate.ErrKeyNotFound) {
		return false, err
	}

	if status == auxiliary.TicketStatusAvailable {
		ctx.Set("status", auxiliary.TicketStatusReserved)
		return true, nil
	} else {
		return false, nil
	}
}

// <end_reserve>

// <start_unreserve>
func (TicketObject) Unreserve(ctx restate.ObjectContext, _ restate.Void) (restate.Void, error) {
	status, err := restate.GetAs[auxiliary.TicketStatus](ctx, "status")
	if err != nil && !errors.Is(err, restate.ErrKeyNotFound) {
		return restate.Void{}, err
	}

	if status != auxiliary.TicketStatusSold {
		ctx.Clear("status")
	}

	return restate.Void{}, nil
}

// <end_unreserve>

// <start_mark_as_sold>
func (TicketObject) MarkAsSold(ctx restate.ObjectContext, _ restate.Void) (restate.Void, error) {
	status, err := restate.GetAs[auxiliary.TicketStatus](ctx, "status")
	if err != nil && !errors.Is(err, restate.ErrKeyNotFound) {
		return restate.Void{}, err
	}

	if status == auxiliary.TicketStatusReserved {
		ctx.Set("status", auxiliary.TicketStatusSold)
	}

	return restate.Void{}, nil
}

// <end_mark_as_sold>
