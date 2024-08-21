package main

import restate "github.com/restatedev/sdk-go"

type TicketObject struct{}

func (TicketObject) Reserve(ctx restate.ObjectContext) (bool, error) {
	return true, nil
}

func (TicketObject) Unreserve(ctx restate.ObjectContext) error {
	return nil
}

func (TicketObject) MarkAsSold(ctx restate.ObjectContext) error {
	return nil
}
