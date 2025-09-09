package examples

import (
	restate "github.com/restatedev/sdk-go"
)

// SignupWorkflow - Basic workflow example
type SignupWorkflow struct{}

func (SignupWorkflow) Run(ctx restate.WorkflowContext, user User) (bool, error) {
	userID := restate.Key(ctx) // workflow ID = user ID

	// Write to database
	success, err := restate.Run(ctx, func(ctx restate.RunContext) (bool, error) {
		return CreateUser(userID, user)
	})
	if err != nil {
		return false, err
	}
	if !success {
		return false, nil
	}

	// Call APIs
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
