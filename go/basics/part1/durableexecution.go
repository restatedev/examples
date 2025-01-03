package main

import (
	"context"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log/slog"
	"os"
)

// Restate lets you implement resilient applications.
// Restate ensures handler code runs to completion despite failures:
//  - Automatic retries
//  - Restate tracks the progress of execution, and prevents re-execution of completed work on retries
//  - Regular code and control flow, no custom DSLs
// Applications consist of services with handlers that can be called over HTTP or Kafka.
//
// Handlers can be called at http://restate:8080/ServiceName/handlerName
// Restate persists HTTP requests to this handler and manages execution.

type SubscriptionRequest struct {
	UserID        string   `json:"userId"`
	CreditCard    string   `json:"creditCard"`
	Subscriptions []string `json:"subscriptions"`
}

type SubscriptionService struct{}

func (SubscriptionService) Add(ctx restate.Context, req SubscriptionRequest) error {
	// Stable idempotency key: Restate persists the result of
	// all `ctx` actions and recovers them after failures
	paymentId := restate.Rand(ctx).UUID().String()

	// Retried in case of timeouts, API downtime, etc.
	payRef, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return CreateRecurringPayment(req.CreditCard, paymentId)
	})
	if err != nil {
		return err
	}

	// Persists successful subscriptions and skip them on retries
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
