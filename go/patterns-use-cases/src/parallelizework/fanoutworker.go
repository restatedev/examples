package main

import (
	"context"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log/slog"
	"os"
)

/**
 * Restate makes it easy to parallelize async work by fanning out tasks.
 * Afterward, you can collect the result by fanning in the partial results.
 *          +------------+
 *          | Split task |
 *          +------------+
 *                |
 *        ---------------------------------
 *        |                |              |
 * +--------------+ +--------------+ +--------------+
 * | Exec subtask | | Exec subtask | | Exec subtask |
 * +--------------+ +--------------+ +--------------+
 *        |                |               |
 *        ---------------------------------
 *                |
 *          +------------+
 *          | Aggregate  |
 *          +------------+
 * Durable Execution ensures that the fan-out and fan-in steps happen reliably exactly once.
 */

type FanOutWorker struct{}

func (FanOutWorker) Run(ctx restate.Context, task Task) (Result, error) {
	// Split the task into subtasks
	subtasks, err := split(task)
	if err != nil {
		return Result{}, err
	}

	// Fan out the subtasks - run them in parallel
	subtaskFutures := make([]restate.Selectable, 0, len(subtasks))
	for _, subtask := range subtasks {
		subtaskFutures = append(subtaskFutures,
			restate.Service[SubTaskResult](ctx, "FanOutWorker", "RunSubtask").RequestFuture(subtask))
	}

	selector := restate.Select(ctx, subtaskFutures...)

	// Fan in - Aggregate the results
	subResults := make([]SubTaskResult, 0, len(subtasks))
	for selector.Remaining() {
		response, err := selector.Select().(restate.ResponseFuture[SubTaskResult]).Response()
		if err != nil {
			return Result{}, err
		}
		subResults = append(subResults, response)
	}

	// Fan in - Aggregate the results
	return aggregate(subResults)
}

// RunSubtask can also run on FaaS
func (FanOutWorker) RunSubtask(ctx restate.Context, subtask SubTask) (SubTaskResult, error) {
	// Processing logic goes here ...
	// Can be moved to a separate service to scale independently
	return executeSubtask(ctx, subtask)
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(FanOutWorker{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}
