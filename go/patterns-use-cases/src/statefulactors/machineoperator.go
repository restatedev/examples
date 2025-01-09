package main

import (
	"context"
	"fmt"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log/slog"
	"os"
)

// This is a State Machine implemented with a Virtual Object
//
//   - The object holds the state of the state machine and defines the methods
//     to transition between the states.
//   - The object's unique id identifies the state machine. Many parallel state
//     machines exist, but only state machine (object) exists per id.
//   - The "single-writer-per-key" characteristic of virtual objects ensures
//     that one state transition per state machine is in progress at a time.
//     Additional transitions are enqueued for that object, while a transition
//     for a machine is still in progress.

type MachineOperator struct{}

func (MachineOperator) SetUp(ctx restate.ObjectContext) (string, error) {
	machineId := restate.Key(ctx)

	status, err := restate.Get[Status](ctx, "status")
	if err != nil {
		return "", err
	}

	// Ignore duplicate calls to 'setUp'
	if status == UP {
		return fmt.Sprintf("%s is already up, so nothing to do", machineId), nil
	}

	// Bringing up a machine is a slow process that frequently crashes
	// Any other requests to this Virtual Object will be enqueued until this handler is done
	if err := bringUpMachine(ctx, machineId); err != nil {
		return "", err
	}
	restate.Set(ctx, "status", UP)

	return fmt.Sprintf("%s is now up", machineId), nil
}

func (MachineOperator) TearDown(ctx restate.ObjectContext) (string, error) {
	machineId := restate.Key(ctx)

	status, err := restate.Get[Status](ctx, "status")
	if err != nil {
		return "", err
	}

	if status != UP {
		return fmt.Sprintf("%s is not up, cannot tear down", machineId), nil
	}

	// Tearing down a machine is a slow process that frequently crashes
	// Any other requests to this Virtual Object will be enqueued until this handler is done
	if err := tearDownMachine(ctx, machineId); err != nil {
		return "", err
	}
	restate.Set(ctx, "status", DOWN)

	return fmt.Sprintf("%s is now down", machineId), nil
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(MachineOperator{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}
