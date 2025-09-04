package main

import (
	"context"
	"log/slog"
	"os"

	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"

	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/communication"
	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/concurrenttasks"
	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/events"
	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/getstarted"
	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/objects"
	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/sagas"
	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/shared"
	"github.com/restatedev/examples/go/tutorials/tour-of-orchestration-go/timers"
)

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(concurrenttasks.ParallelSubscriptionService{})).
		Bind(restate.Reflect(sagas.SubscriptionSaga{})).
		Bind(restate.Reflect(events.Payments{})).
		Bind(restate.Reflect(getstarted.SubscriptionService{})).
		Bind(restate.Reflect(objects.UserSubscriptions{})).
		Bind(restate.Reflect(timers.PaymentsWithTimeout{})).
		Bind(restate.Reflect(communication.ConcertTicketingService{})).
		Bind(restate.Reflect(shared.PaymentService{})).
		Bind(restate.Reflect(shared.EmailService{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}
