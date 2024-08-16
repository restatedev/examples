package main

import (
	"context"
	"log"

	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
)

func main() {
	if err := server.NewRestate().
		Bind(restate.Reflect(CartObject{})).
		Bind(restate.Reflect(TicketObject{})).
		Bind(restate.Reflect(CheckoutService{})).
		Start(context.Background(), ":9080"); err != nil {
		log.Fatal(err)
	}
}
