package objects

import (
	"context"
	"log"
	"time"

	"github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
)

type UserSubscriptions struct{}

func (UserSubscriptions) Add(ctx restate.ObjectContext, subscription string) error {
	// Get current subscriptions
	var subscriptions []string
	has, err := restate.Get(ctx, "subscriptions", &subscriptions)
	if err != nil {
		return err
	}
	if !has {
		subscriptions = []string{}
	}

	// Add new subscription if not already present
	found := false
	for _, sub := range subscriptions {
		if sub == subscription {
			found = true
			break
		}
	}
	if !found {
		subscriptions = append(subscriptions, subscription)
	}

	// Save subscriptions
	restate.Set(ctx, "subscriptions", subscriptions)

	// Update metrics
	restate.Set(ctx, "lastUpdated", time.Now().Format(time.RFC3339))

	return nil
}

func (UserSubscriptions) GetSubscriptions(ctx restate.ObjectSharedContext) ([]string, error) {
	var subscriptions []string
	has, err := restate.Get(ctx, "subscriptions", &subscriptions)
	if err != nil {
		return nil, err
	}
	if !has {
		subscriptions = []string{}
	}
	return subscriptions, nil
}
