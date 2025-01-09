package main

import (
	"context"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log/slog"
	"os"
)

/*
 * The product service is deployed somewhere as a Restate application.
 * It is a virtual object that makes sure only one reservation is made concurrently.
 */

type ProductService struct{}

func (ProductService) Reserve(ctx restate.ObjectContext) (bool, error) {
	reserved, err := restate.Get[bool](ctx, "reserved")
	if err != nil {
		return false, err
	}

	if reserved == true {
		slog.Info("Product already reserved")
		return false, nil
	}

	slog.Info("Reserving product")
	restate.Set(ctx, "reserved", true)
	return true, nil
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(ProductService{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}
