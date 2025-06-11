package main

import (
	"context"
	"fmt"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
)

type TaskService struct{}

func (TaskService) ExecuteTask(ctx restate.Context, payload string) error {
	fmt.Printf("Executing task: %s", payload)
	return nil
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(CronJobInitiator{})).
		Bind(restate.Reflect(CronJob{})).
		Bind(restate.Reflect(TaskService{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		panic(err)
	}
}
