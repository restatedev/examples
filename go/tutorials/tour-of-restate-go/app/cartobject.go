package main

import restate "github.com/restatedev/sdk-go"

// <start_user_session>
type CartObject struct{}

func (CartObject) AddTicket(ctx restate.ObjectContext, ticketId string) (bool, error) {
	return true, nil
}

func (CartObject) Checkout(ctx restate.ObjectContext) (bool, error) {
	return true, nil
}

func (CartObject) ExpireTicket(ctx restate.ObjectContext, ticketId string) error {
	return nil
}

// <end_user_session>
