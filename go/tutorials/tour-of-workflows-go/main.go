package main

import (
	"context"
	"log"

	"github.com/restatedev/examples/go/tutorials/tour-of-workflows-go/examples"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
)

func main() {
	if err := server.NewRestate().
		// Bind workflows
		Bind(restate.Reflect(examples.SignupWorkflow{})).
		Bind(restate.Reflect(examples.SignupWithActivitiesWorkflow{})).
		Bind(restate.Reflect(examples.SignupWithEventsWorkflow{})).
		Bind(restate.Reflect(examples.SignupWithQueriesWorkflow{})).
		Bind(restate.Reflect(examples.SignupWithRetriesWorkflow{})).
		Bind(restate.Reflect(examples.SagasWorkflow{})).
		Bind(restate.Reflect(examples.SignupWithSignalsWorkflow{})).
		Bind(restate.Reflect(examples.SignupWithTimersWorkflow{})).

		// Bind utility services
		Bind(restate.Reflect(examples.UserService{})).
		Start(context.Background(), ":9080"); err != nil {
		log.Fatal(err)
	}
}
