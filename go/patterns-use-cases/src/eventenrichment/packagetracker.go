package main

import (
	"context"
	"errors"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log/slog"
	"os"
)

type LocationUpdate struct {
	Timestamp string `json:"timestamp"`
	Location  string `json:"location"`
}

type PackageInfo struct {
	FinalDestination string           `json:"finalDestination"`
	Locations        []LocationUpdate `json:"locations"`
}

const PACKAGE_INFO = "package-info"

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
	packageInfo, err := restate.Get[PackageInfo](ctx, PACKAGE_INFO)
	if err != nil {
		return err
	}

	if packageInfo.FinalDestination == "" {
		return restate.TerminalError(errors.New("package not found"))
	}

	// Update the package details in the state
	packageInfo.Locations = append(packageInfo.Locations, locationUpdate)
	restate.Set[PackageInfo](ctx, PACKAGE_INFO, packageInfo)
	return nil
}

// GetPackageInfo Called by the delivery dashboard to get the package details
func (PackageTracker) GetPackageInfo(ctx restate.ObjectSharedContext) (PackageInfo, error) {
	packageInfo, err := restate.Get[PackageInfo](ctx, PACKAGE_INFO)
	if err != nil {
		return PackageInfo{}, err
	}
	return packageInfo, nil
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(PackageTracker{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}

// Process package tracking events via HTTP:
/*
curl localhost:8080/PackageTracker/package1234/RegisterPackage -H 'content-type: application/json' -d '{ "finalDestination": "Bridge 6, Amsterdam", "locations": [] }'
curl localhost:8080/PackageTracker/package1234/UpdateLocation -H 'content-type: application/json' -d '{ "timestamp": "2024-12-11T12:00:00Z", "location": "Warehouse A" }'
curl localhost:8080/PackageTracker/package1234/GetPackageInfo
*/
