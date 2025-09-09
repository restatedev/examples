package main

import (
	"context"
	"log"
	"os"

	"github.com/restatedev/examples/go/tutorials/tour-of-workflows-go/examples"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
)

func main() {
	server := server.NewRestate().

		// Bind workflows
		Bind(restate.Reflect(examples.SignupWorkflow{})).
		Bind(restate.Reflect(examples.SignupWithActivitiesWorkflow{})).
		Bind(restate.Reflect(examples.SignupWithEventsWorkflow{})).
		Bind(restate.Reflect(examples.SignupWithQueriesWorkflow{})).
		Bind(restate.Reflect(examples.RetriesWorkflow{})).
		Bind(restate.Reflect(examples.SagasWorkflow{})).
		Bind(restate.Reflect(examples.SignupWithSignalsWorkflow{})).
		Bind(restate.Reflect(examples.SignupWithTimersWorkflow{})).

		// Bind utility services
		Bind(restate.Reflect(examples.EmailService{})).
		Bind(restate.Reflect(examples.UserService{}))

	if err := server.Start(context.Background(), ":8000"); err != nil {
		log.Printf("application exited unexpectedly: %v", err)
		os.Exit(1)
	}
}
