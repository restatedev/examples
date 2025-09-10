package examples

import (
	restate "github.com/restatedev/sdk-go"
)

type RetriesWorkflow struct{}

func (RetriesWorkflow) Run(ctx restate.WorkflowContext, user User) (bool, error) {
	userID := restate.Key(ctx)

	success, err := restate.Run(ctx, func(ctx restate.RunContext) (bool, error) {
		return CreateUser(userID, user)
	}, restate.WithName("create"))
	if err != nil {
		return false, err
	}
	if !success {
		return false, nil
	}

	_, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return ActivateUser(userID)
	}, restate.WithName("activate"))
	if err != nil {
		return false, err
	}

	// <start_retries>
	_, err = restate.Run(ctx,
		func(ctx restate.RunContext) (restate.Void, error) {
			return SendWelcomeEmail(user)
		},
		restate.WithName("welcome"),
		restate.WithMaxRetryAttempts(3),
		restate.WithInitialRetryInterval(1000),
	)
	if err != nil {
		return false, err
	}
	// <end_retries>

	return true, nil
}
