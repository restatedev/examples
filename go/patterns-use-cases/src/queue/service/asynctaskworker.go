package main

import (
	"context"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log/slog"
	"os"
)

type TaskOpts struct {
	Id          string `json:"id"`
	Description string `json:"description"`
}

type Result struct {
	Description string `json:"description"`
}

type AsyncTaskWorker struct{}

func (AsyncTaskWorker) RunTask(ctx restate.Context, task TaskOpts) (Result, error) {
	return someHeavyWork(task)
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(AsyncTaskWorker{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}

func someHeavyWork(task TaskOpts) (Result, error) {
	// Implement doing the heavy work...
	return Result{}, nil
}
