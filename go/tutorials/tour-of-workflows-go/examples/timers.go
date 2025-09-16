package examples

import (
	"fmt"
	"time"

	restate "github.com/restatedev/sdk-go"
)

type SignupWithTimersWorkflow struct{}

func (SignupWithTimersWorkflow) Run(ctx restate.WorkflowContext, user User) (bool, error) {
	userID := restate.Key(ctx)

	secret := restate.Rand(ctx).UUID().String()
	_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return SendVerificationEmail(userID, user, secret)
	}, restate.WithName("verify"))
	if err != nil {
		return false, err
	}

	clickedPromise := restate.Promise[string](ctx, "email-verified")
	verificationTimeoutFuture := restate.After(ctx, 24*time.Hour)

	for {
		reminderTimerFuture := restate.After(ctx, 15*time.Second)

		// Create futures for racing
		selector := restate.Select(ctx,
			clickedPromise,
			reminderTimerFuture,
			verificationTimeoutFuture,
		)

		switch selector.Select() {
		case clickedPromise:
			clickedSecret, err := clickedPromise.Result()
			if err != nil {
				return false, err
			}
			return clickedSecret == secret, nil
		case reminderTimerFuture:
			_, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
				return SendReminderEmail(userID, user, secret)
			}, restate.WithName("send reminder"))
			if err != nil {
				return false, err
			}
			break // Break out of selector loop to continue main loop
		case verificationTimeoutFuture:
			return false, restate.TerminalError(fmt.Errorf("email verification timed out after 24 hours"))
		}
	}
}

func (SignupWithTimersWorkflow) VerifyEmail(ctx restate.WorkflowSharedContext, req VerifyEmailRequest) error {
	return restate.Promise[string](ctx, "email-verified").Resolve(req.Secret)
}
