package examples

import (
	restate "github.com/restatedev/sdk-go"
)

type SagasWorkflow struct{}

func (SagasWorkflow) Run(ctx restate.WorkflowContext, user User) (res bool, err error) {
	userID := restate.Key(ctx)
	var compensations []func() error

	defer func() {
		if err != nil {
			for i := len(compensations) - 1; i >= 0; i-- {
				if compErr := compensations[i](); compErr != nil {
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
