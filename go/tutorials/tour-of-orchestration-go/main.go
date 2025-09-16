package main

import (
	"context"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log"

	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/examples"
)

func main() {
	if err := server.NewRestate().
		Bind(restate.Reflect(examples.ParallelSubscriptionService{})).
		Bind(restate.Reflect(examples.SubscriptionSaga{})).
		Bind(restate.Reflect(examples.Payments{})).
		Bind(restate.Reflect(examples.SubscriptionService{})).
		Bind(restate.Reflect(examples.UserSubscriptions{})).
		Bind(restate.Reflect(examples.PaymentsWithTimeout{})).
		Bind(restate.Reflect(examples.ConcertTicketingService{})).
		Bind(restate.Reflect(examples.PaymentService{})).
		Bind(restate.Reflect(examples.EmailService{})).
		Start(context.Background(), ":9080"); err != nil {
		log.Fatal(err)
	}
}
