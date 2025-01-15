package main

import (
	"context"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log/slog"
	"os"
)

// Restate helps you implement resilient applications:
//  - Automatic retries
//  - Tracking progress of execution and preventing re-execution of completed work on retries
//  - Providing durable building blocks like timers, promises, and messaging: recoverable and revivable anywhere
//
// Applications consist of services with handlers that can be called over HTTP or Kafka.
// Handlers can be called at http://restate:8080/ServiceName/handlerName
//
// Restate persists and proxies HTTP requests to handlers and manages their execution:
//
// ┌────────┐   ┌─────────┐   ┌────────────────────────────┐
// │ HTTP   │ → │ Restate │ → │ Restate Service (with SDK) │
// │ Client │ ← │         │ ← │   handler1(), handler2()   │
// └────────┘   └─────────┘   └────────────────────────────┘
//
// The SDK lets you implement handlers with regular code and control flow.
// Handlers have access to a Context that provides durable building blocks that get persisted in Restate.
// Whenever a handler uses the Restate Context, an event gets persisted in Restate's log.
// After a failure, a retry is triggered and this log gets replayed to recover the state of the handler.

type SubscriptionRequest struct {
	UserID        string   `json:"userId"`
	CreditCard    string   `json:"creditCard"`
	Subscriptions []string `json:"subscriptions"`
}

type SubscriptionService struct{}

func (SubscriptionService) Add(ctx restate.Context, req SubscriptionRequest) error {
	// Restate persists the result of all `ctx` actions and recovers them after failures
	// For example, generate a stable idempotency key:
	paymentId := restate.Rand(ctx).UUID().String()

	// restate.Run persists results of successful actions and skips execution on retries
	// Failed actions (timeouts, API downtime, etc.) get retried
	payRef, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return CreateRecurringPayment(req.CreditCard, paymentId)
	})
	if err != nil {
		return err
	}

	for _, subscription := range req.Subscriptions {
		if _, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, CreateSubscription(req.UserID, subscription, payRef)
		}); err != nil {
			return err
		}
	}

	return nil
}

// Create an HTTP endpoint to serve your services on port 9080
func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(SubscriptionService{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}

/*
Check the README to learn how to run Restate.
Then invoke this function and see in the log how it recovers.
Each action (e.g. "created recurring payment") is only logged once across all retries.
Retries did not re-execute the successful operations.

curl localhost:8080/SubscriptionService/Add -H 'content-type: application/json' -d \
'{
    "userId": "Sam Beckett",
    "creditCard": "1234-5678-9012-3456",
    "subscriptions" : ["Netflix", "Disney+", "HBO Max"]
}'
*/
