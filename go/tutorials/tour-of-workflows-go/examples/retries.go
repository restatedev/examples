package examples

import (
	"fmt"
	restate "github.com/restatedev/sdk-go"
)

type SignupWithRetriesWorkflow struct{}

func (SignupWithRetriesWorkflow) Run(ctx restate.WorkflowContext, user User) (bool, error) {
	userID := restate.Key(ctx)

	success, err := restate.Run(ctx, func(ctx restate.RunContext) (bool, error) {
		return CreateUser(userID, user)
	}, restate.WithName("create"))
	if err != nil || !success {
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
		// This gets hit on retry exhaustion with a terminal error
		// Log and continue; without letting the workflow fail
		fmt.Printf("Couldn't send the email due to terminal error %s", err)
	}
	// <end_retries>

	return true, nil
}
