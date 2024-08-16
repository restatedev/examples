package main

import restate "github.com/restatedev/sdk-go"

type CheckoutService struct{}

type CheckoutRequest struct {
	UserId  string   `json:"userId"`
	Tickets []string `json:"tickets"`
}

func (CheckoutService) Handle(ctx restate.ObjectContext, request CheckoutRequest) (bool, error) {
	ctx.Log().Info("Hello")
	return true, nil
}
