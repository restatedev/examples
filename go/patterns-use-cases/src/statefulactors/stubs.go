package main

import (
	"fmt"
	"log/slog"
	"math/rand"
	"time"

	restate "github.com/restatedev/sdk-go"
)

type Status string

const (
	UP   Status = "UP"
	DOWN Status = "DOWN"
)

func bringUpMachine(ctx restate.Context, machineId string) error {
	slog.Info("Beginning transition to up: " + machineId)
	if err := MaybeCrash(0.4); err != nil {
		return err
	}
	err := restate.Sleep(ctx, 5*time.Second)
	if err != nil {
		return err
	}
	slog.Info("Done transitioning to up: " + machineId)
	return nil
}

func tearDownMachine(ctx restate.Context, machineId string) error {
	slog.Info("Beginning transition to down: " + machineId)
	if err := MaybeCrash(0.4); err != nil {
		return err
	}
	err := restate.Sleep(ctx, 5*time.Second)
	if err != nil {
		return err
	}
	slog.Info("Done transitioning to down: " + machineId)
	return nil
}

func MaybeCrash(probability float32) error {
	if rand.Float32() < probability { // 50% chance of failure
		fmt.Printf("👻 A failure happened!")
		return fmt.Errorf("a failure happened")
	}
	return nil
}
