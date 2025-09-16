package examples

import (
	"time"

	"github.com/restatedev/sdk-go"
)

type UserSubscriptions struct{}

func (UserSubscriptions) Add(ctx restate.ObjectContext, subscription string) error {
	// Get current subscriptions
	subscriptions, err := restate.Get[[]string](ctx, "subscriptions")
	if err != nil {
		return err
	}
	if subscriptions == nil {
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
	return restate.Get[[]string](ctx, "subscriptions")
}
