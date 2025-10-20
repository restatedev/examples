package main

import (
	"time"

	restate "github.com/restatedev/sdk-go"
)

// Greeter is a struct which represents a Restate service; reflection will turn exported methods into service handlers
type Greeter struct{}

func (Greeter) Greet(ctx restate.Context, name string) (string, error) {
	//  Durably execute a set of steps; resilient against failures
	greetingId := restate.UUID(ctx).String()

	if _, err := restate.Run(ctx,
		func(ctx restate.RunContext) (restate.Void, error) {
			return SendNotification(greetingId, name)
		},
		restate.WithName("Notification"),
	); err != nil {
		return "", err
	}

	if err := restate.Sleep(ctx, 1*time.Second); err != nil {
		return "", err
	}

	if _, err := restate.Run(ctx,
		func(ctx restate.RunContext) (restate.Void, error) {
			return SendReminder(greetingId, name)
		},
		restate.WithName("Reminder"),
	); err != nil {
		return "", err
	}

	// Respond to caller
	return "You said hi to " + name + "!", nil
}
