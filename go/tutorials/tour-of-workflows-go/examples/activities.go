package examples

import (
	restate "github.com/restatedev/sdk-go"
)

type SignupWithActivitiesWorkflow struct{}

func (SignupWithActivitiesWorkflow) Run(ctx restate.WorkflowContext, user User) (bool, error) {
	userID := restate.Key(ctx) // workflow ID = user ID

	// <start_activities>
	// Move user DB interaction to dedicated service
	success, err := restate.Service[bool](ctx, "UserService", "CreateUser").
		Request(CreateUserRequest{UserID: userID, User: user})
	if err != nil || !success {
		return false, err
	}

	// Execute other steps inline
	_, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return ActivateUser(userID)
	}, restate.WithName("activate"))
	if err != nil {
		return false, err
	}

	_, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return SendWelcomeEmail(user)
	}, restate.WithName("welcome"))
	if err != nil {
		return false, err
	}
	// <end_activities>

	return true, nil
}
