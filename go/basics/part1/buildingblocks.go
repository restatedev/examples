package main

import (
	restate "github.com/restatedev/sdk-go"
	"log/slog"
	"time"
)

type SubscriptionRequest struct {
	UserID string `json:"userId"`
}

type MyService struct{}

func (MyService) Run(ctx restate.Context) error {
	// 1. IDEMPOTENCY: Add an idempotency key to the header of your requests
	// Restate deduplicates calls automatically. Nothing to do here.

	// 2. DURABLE RPC: Call other services without manual retry and deduplication logic
	// Restate persists all requests and ensures execution till completion
	response, err := restate.Object[string](ctx, "SubscriptionService", "my-sub-123", "Add").
		Request(SubscriptionRequest{UserID: "123"})
	if err != nil {
		return err
	}
	slog.Info("Response was: " + response)

	// 3. DURABLE MESSAGING: send (delayed) messages to other services without deploying a message broker
	// Restate persists the timers and triggers execution
	restate.ObjectSend(ctx, "SubscriptionService", "my-sub-123", "Add").
		Send(SubscriptionRequest{UserID: "123"})

	// 4. DURABLE PROMISES: tracked by Restate, can be moved between processes and survive failures
	// Awakeables: block the workflow until notified by another handler
	awakeable := restate.Awakeable[string](ctx)
	// Wait on the result
	result, err := awakeable.Result()
	if err != nil {
		return err
	}
	slog.Info("Promise resolved", "result", result)
	// Another process can resolve an awakeable with its ID
	restate.ResolveAwakeable[string](ctx, awakeable.Id(), "hello")

	// 5. DURABLE TIMERS: sleep or wait for a timeout, tracked by Restate and recoverable
	// When this runs on FaaS, the handler suspends and the timer is tracked by Restate
	// Example of durable recoverable sleep
	// If the service crashes two seconds later, Restate will invoke it after another 3 seconds
	err = restate.Sleep(ctx, 5*time.Second)
	if err != nil {
		return err
	}
	// Example of waiting on a promise (awakeable/call/...) or a timeout
	timeout := restate.After(ctx, 5*time.Second)
	selector := restate.Select(ctx, awakeable, timeout)
	switch selector.Select() {
	case awakeable:
		result, err := awakeable.Result()
		if err != nil {
			return err
		}
		slog.Info("Awakeable won with result: " + result)
	case timeout:
		if err := timeout.Done(); err != nil {
			return err
		}
		slog.Info("Sleep won")
	}
	// Example of scheduling a handler for later on
	restate.ObjectSend(ctx, "SubscriptionService", "my-sub-123", "Cancel").
		Send(nil, restate.WithDelay(24*time.Hour))

	// 7. PERSIST RESULTS: avoid re-execution of actions on retries
	// Use this for non-deterministic actions or interaction with APIs, DBs, ...
	// For example, generate idempotency keys that are stable across retries
	// Then use these to call other APIs and let them deduplicate
	paymentDeduplicationID := restate.Rand(ctx).UUID().String()
	success, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return chargeBankAccount(paymentDeduplicationID, 100)
	})
	if err != nil {
		return err
	}
	slog.Info("Payment was successful: " + success)

	return nil
}

func chargeBankAccount(paymentDeduplicationID string, amount int64) (string, error) {
	// Implementation here
	return "", nil
}
