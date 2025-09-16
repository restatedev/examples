package examples

import (
	restate "github.com/restatedev/sdk-go"
)

type SignupWithSignalsWorkflow struct{}

func (SignupWithSignalsWorkflow) Run(ctx restate.WorkflowContext, user User) (bool, error) {
	userID := restate.Key(ctx)

	// Generate verification secret and send email
	secret := restate.Rand(ctx).UUID().String()
	_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return SendVerificationEmail(userID, user, secret)
	}, restate.WithName("verify"))
	if err != nil {
		return false, err
	}

	// Wait for user to click verification link
	clickedSecret, err := restate.Promise[string](ctx, "email-verified").Result()
	if err != nil {
		return false, err
	}

	return clickedSecret == secret, nil
}

func (SignupWithSignalsWorkflow) VerifyEmail(ctx restate.WorkflowSharedContext, req VerifyEmailRequest) error {
	// Resolve the promise to continue the main workflow
	return restate.Promise[string](ctx, "email-verified").Resolve(req.Secret)
}
