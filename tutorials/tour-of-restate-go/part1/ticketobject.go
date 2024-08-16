package main

import restate "github.com/restatedev/sdk-go"

type TicketObject struct{}

func (TicketObject) Reserve(ctx restate.ObjectContext, _ restate.Void) (bool, error) {
	return true, nil
}

func (TicketObject) Unreserve(ctx restate.ObjectContext, _ restate.Void) (restate.Void, error) {
	return restate.Void{}, nil
}

func (TicketObject) MarkAsSold(ctx restate.ObjectContext, _ restate.Void) (restate.Void, error) {
	return restate.Void{}, nil
}
