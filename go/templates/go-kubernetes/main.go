package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"github.com/restatedev/sdk-go/x/tunnel"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	srv := server.NewRestate().
		Bind(restate.Reflect(Greeter{}))

	// The Restate operator injects the RESTATE_INPROC_* tunnel configuration.
	if err := tunnel.NewTunnel(srv).Start(ctx); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}
