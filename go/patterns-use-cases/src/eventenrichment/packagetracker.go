package main

import (
	"context"
	"errors"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log"
)

type LocationUpdate struct {
	Timestamp string `json:"timestamp"`
	Location  string `json:"location"`
}

type PackageInfo struct {
	FinalDestination string           `json:"finalDestination"`
	Locations        []LocationUpdate `json:"locations"`
}

// Package tracking system:
// Digital twin representing a package in delivery with real-time location updates.
// Handlers get called over HTTP or Kafka.

type PackageTracker struct{}

// RegisterPackage Called first by the seller over HTTP
func (PackageTracker) RegisterPackage(ctx restate.ObjectContext, packageInfo PackageInfo) error {
	restate.Set[PackageInfo](ctx, "package-info", packageInfo)
	return nil
}

// UpdateLocation Connected to a Kafka topic for real-time location updates
func (PackageTracker) UpdateLocation(ctx restate.ObjectContext, locationUpdate LocationUpdate) error {
	packageInfo, err := restate.Get[*PackageInfo](ctx, "package-info")
	if err != nil {
		return err
	}
	if packageInfo == nil {
		return restate.TerminalError(errors.New("package not found"))
	}

	// Update the package details in the state
	packageInfo.Locations = append(packageInfo.Locations, locationUpdate)
	restate.Set[PackageInfo](ctx, "package-info", *packageInfo)
	return nil
}

// GetPackageInfo Called by the delivery dashboard to get the package details
func (PackageTracker) GetPackageInfo(ctx restate.ObjectSharedContext) (*PackageInfo, error) {
	return restate.Get[*PackageInfo](ctx, "package-info")
}

func main() {
	if err := server.NewRestate().
		Bind(restate.Reflect(PackageTracker{})).
		Start(context.Background(), ":9080"); err != nil {
		log.Fatal(err)
	}
}
