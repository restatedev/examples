package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/restatedev/examples/go/patterns-use-cases/src/ratelimit/client"
	"github.com/restatedev/examples/go/patterns-use-cases/src/ratelimit/service"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
)

type TaskOpts struct {
	Id          string `json:"id"`
	Description string `json:"description"`
}

type Result struct {
	Description string `json:"description"`
}

type LimitedTask struct{}

func (LimitedTask) RunTask(ctx restate.Context) error {
	limiter := client.NewLimiter(ctx, "LimitedTask-RunTask")
	if err := limiter.Wait(); err != nil {
		return err
	}

	// Implement doing the work...

	return nil
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(service.Limiter{})).
		Bind(restate.Reflect(LimitedTask{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}
