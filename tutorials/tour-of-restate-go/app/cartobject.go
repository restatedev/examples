package main

import restate "github.com/restatedev/sdk-go"

// <start_user_session>
type CartObject struct{}

func (CartObject) AddTicket(ctx restate.ObjectContext, ticketId string) (bool, error) {
	return true, nil
}

func (CartObject) Checkout(ctx restate.ObjectContext, _ restate.Void) (bool, error) {
	return true, nil
}

func (CartObject) ExpireTicket(ctx restate.ObjectContext, ticketId string) (restate.Void, error) {
	return restate.Void{}, nil
}

// <end_user_session>
