package examples

import (
	restate "github.com/restatedev/sdk-go"
)

type SignupWithQueriesWorkflow struct{}

func (SignupWithQueriesWorkflow) Run(ctx restate.WorkflowContext, user User) (bool, error) {
	userID := restate.Key(ctx)

	restate.Set(ctx, "user", user)
	success, err := restate.Run(ctx, func(ctx restate.RunContext) (bool, error) {
		return CreateUser(userID, user)
	}, restate.WithName("create"))
	if err != nil {
		return false, err
	}
	if !success {
		restate.Set(ctx, "status", "failed")
		return success, nil
	}
	restate.Set(ctx, "status", "created")

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

	return success, nil
}

func (SignupWithQueriesWorkflow) GetStatus(ctx restate.WorkflowSharedContext) (StatusResponse, error) {
	status, err := restate.Get[string](ctx, "status")
	if err != nil {
		return StatusResponse{}, err
	}
	user, err := restate.Get[User](ctx, "user")
	if err != nil {
		return StatusResponse{}, err
	}
	return StatusResponse{Status: &status, User: &user}, nil
}
