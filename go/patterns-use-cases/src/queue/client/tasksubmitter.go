package main

import (
	"context"
	"log/slog"

	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/ingress"
)

const RESTATE_URL = "http://localhost:8080"

type TaskOpts struct {
	Id          string `json:"id"`
	Description string `json:"description"`
}

type Result struct {
	Description string `json:"description"`
}

func SubmitAndAwaitTask(task TaskOpts) error {
	idempotencyKey := task.Id

	ingressClient := ingress.NewClient(RESTATE_URL)

	invocationHandle, err := ingress.Service[TaskOpts, Result](ingressClient,
		"AsyncTaskWorker",
		"RunTask").
		Send(context.Background(),
			task,
			// use a stable uuid as an idempotency key; Restate deduplicates for us
			restate.WithIdempotencyKey(idempotencyKey),
			// Optionally add delay
			// restate.WithDelay(10 * time.Second),
		)
	if err != nil {
		return err
	}

	// ... do other things while the task is being processed ...

	// Later on, you can retrieve the result of the task (possibly in a different process)
	res, err := invocationHandle.Attach(context.Background())
	if err != nil {
		return err
	}

	slog.Info("Task result", "result", res)

	// ... Process the result ...

	return nil
}

func main() {
	task := TaskOpts{
		Id:          "task1",
		Description: "some heavy work",
	}
	err := SubmitAndAwaitTask(task)
	if err != nil {
		slog.Error("Task submission failed", "err", err.Error())
		return
	}
	slog.Info("Task submitted successfully")
}
