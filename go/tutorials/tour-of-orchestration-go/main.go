package main

import (
	"context"
	"log/slog"
	"os"

	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
)

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(ParallelSubscriptionService{})).
		Bind(restate.Reflect(SubscriptionSer{})).
		Bind(restate.Reflect(PaymentService{})).
		Bind(restate.Reflect(EmailService{})).
		Bind(restate.Reflect(Payments{})).
		Bind(restate.Reflect(SubscriptionService{})).
		Bind(restate.Reflect(UserSubscriptions{})).
		Bind(restate.Reflect(SubscriptionSaga{})).
		Bind(restate.Reflect(PaymentsWithTimeout{})).
		Bind(restate.Reflect(ConcertTicketingService{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}
