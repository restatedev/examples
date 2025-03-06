package main

import (
	"context"
	"log/slog"
	"os"

	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
)

type User struct {
	Name  string
	Email string
}

// Workflow are a special type of Virtual Object with a run handler that runs once per ID.
// Workflows are stateful and can be interacted with via queries (getting data out of the workflow)
// and signals (pushing data to the workflow).
//
// Workflows are used to model long-running flows, such as user onboarding, order processing, etc.
// Workflows have the following handlers:
//  - Main workflow in run() method
//  - Additional methods interact with the workflow.
// Each workflow instance has a unique ID and runs only once (to success or failure).

type SignupWorkflow struct{}

// --- The workflow logic ---

func (SignupWorkflow) Run(ctx restate.WorkflowContext, user User) (bool, error) {
	// workflow ID = user ID; workflow runs once per user
	userId := restate.Key(ctx)

	// Durably executed action; write to other system
	if _, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return restate.Void{}, CreateUserEntry(user)
	}); err != nil {
		return false, err
	}

	// Send the email with the verification link
	secret := restate.Rand(ctx).UUID().String()
	if _, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return restate.Void{}, SendEmailWithLink(userId, user, secret)
	}); err != nil {
		return false, err
	}

	// Wait until user clicked email verification link
	// Promise gets resolved or rejected by the other handlers
	clickSecret, err := restate.Promise[string](ctx, "link-clicked").Result()
	if err != nil {
		return false, err
	}

	return clickSecret == secret, nil
}

// --- Other handlers interact with the workflow via queries and signals ---

func (SignupWorkflow) Click(ctx restate.WorkflowSharedContext, secret string) error {
	// Send data to the workflow via a durable promise
	return restate.Promise[string](ctx, "link-clicked").Resolve(secret)
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(SignupWorkflow{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}

/*
Check the README to learn how to run Restate.
- Then, submit the workflow via HTTP:
  curl localhost:8080/SignupWorkflow/userid1/Run/send -H 'content-type: application/json' -d '{ "name": "Bob", "email": "bob@builder.com" }'

- Resolve the email link via:
  curl localhost:8080/SignupWorkflow/userid1/Click -H 'content-type: application/json' -d '"xxx"'

- Attach back to the workflow to get the result:
  curl localhost:8080/restate/workflow/SignupWorkflow/userid1/attach
*/
