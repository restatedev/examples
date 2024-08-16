package main

import restate "github.com/restatedev/sdk-go"

// <start_checkout>
type CheckoutService struct{}

type CheckoutRequest struct {
	UserId  string   `json:"userId"`
	Tickets []string `json:"tickets"`
}

func (CheckoutService) Handle(ctx restate.Context, request CheckoutRequest) (bool, error) {
	return true, nil
}

// <end_checkout>
