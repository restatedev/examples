package examples

import (
	"slices"

	restate "github.com/restatedev/sdk-go"
)

type SagasWorkflow struct{}

func (SagasWorkflow) Run(ctx restate.WorkflowContext, user User) (res bool, err error) {
	userID := restate.Key(ctx)
	var compensations []func() error

	defer func() {
		// All errors that end up here are terminal errors, so run compensations
		// (Retry-able errors got returned by the SDK without ending up here)
		if err != nil {
			for _, compensation := range slices.Backward(compensations) {
				if compErr := compensation(); compErr != nil {
					err = compErr
				}
			}
		}
	}()

	// Add compensation for user creation
	compensations = append(compensations, func() error {
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return DeleteUser(userID)
		})
		return err
	})

	_, err = restate.Run(ctx, func(ctx restate.RunContext) (bool, error) {
		return CreateUser(userID, user)
	}, restate.WithName("create"))
	if err != nil {
		return false, err
	}

	// Add compensation for user activation
	compensations = append(compensations, func() error {
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return DeactivateUser(userID)
		})
		return err
	})

	_, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return ActivateUser(userID)
	})
	if err != nil {
		return false, err
	}

	// Add compensation for subscription
	compensations = append(compensations, func() error {
		_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return CancelSubscription(user)
		})
		return err
	})

	_, err = restate.Run(ctx, func(ctx restate.RunContext) (bool, error) {
		return SubscribeToPaidPlan(user)
	})
	if err != nil {
		return false, err
	}

	return true, nil
}
