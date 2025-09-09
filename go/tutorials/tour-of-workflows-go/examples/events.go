package examples

import (
	"fmt"

	restate "github.com/restatedev/sdk-go"
)

// SignupWithEventsWorkflow - Workflow with promises/events
type SignupWithEventsWorkflow struct{}

func (SignupWithEventsWorkflow) Run(ctx restate.WorkflowContext, user User) (bool, error) {
	userID := restate.Key(ctx)

	success, err := restate.Run(ctx, func(ctx restate.RunContext) (bool, error) {
		return CreateUser(userID, user)
	})
	if err != nil {
		return false, err
	}
	if !success {
		if err := restate.Promise[string](ctx, "user-created").Reject(fmt.Errorf("creation failed")); err != nil {
			return false, err
		}
		return false, nil
	}

	if err := restate.Promise[string](ctx, "user-created").Resolve("User created."); err != nil {
		return false, err
	}

	_, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return restate.Void{}, ActivateUser(userID)
	})
	if err != nil {
		return false, err
	}

	_, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return restate.Void{}, SendWelcomeEmail(user)
	})
	if err != nil {
		return false, err
	}

	return true, nil
}

func (SignupWithEventsWorkflow) WaitForUserCreation(ctx restate.WorkflowSharedContext) (string, error) {
	return restate.Promise[string](ctx, "user-created").Result()
}
