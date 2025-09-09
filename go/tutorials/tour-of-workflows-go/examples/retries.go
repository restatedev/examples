package examples

import (
	restate "github.com/restatedev/sdk-go"
)

// RetriesWorkflow - Workflow with custom retry policies
type RetriesWorkflow struct{}

func (RetriesWorkflow) Run(ctx restate.WorkflowContext, user User) (bool, error) {
	userID := restate.Key(ctx)

	success, err := restate.Run(ctx, func(ctx restate.RunContext) (bool, error) {
		return CreateUser(userID, user)
	})
	if err != nil {
		return false, err
	}
	if !success {
		return false, nil
	}

	_, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return restate.Void{}, ActivateUser(userID)
	})
	if err != nil {
		return false, err
	}

	// Configure retry policy using defer for Go-style error handling
	_, err = restate.Run(ctx,
		func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, SendWelcomeEmail(user)
		},
		restate.WithMaxRetryAttempts(3),
		restate.WithInitialRetryInterval(1000),
	)
	if err != nil {
		return false, err
	}

	return true, nil
}
