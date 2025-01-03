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

type PackageTracker struct{}

func (PackageTracker) RegisterPackage(ctx restate.ObjectContext, packageInfo PackageInfo) error {
	restate.Set[PackageInfo](ctx, "package-info", packageInfo)
	return nil
}

func (PackageTracker) UpdateLocation(ctx restate.ObjectContext, locationUpdate LocationUpdate) error {
	packageInfo, err := restate.Get[PackageInfo](ctx, PACKAGE_INFO)
	if err != nil {
		return err
	}

	if packageInfo.FinalDestination == "" {
		return restate.TerminalError(errors.New("package not found"))
	}

	packageInfo.Locations = append(packageInfo.Locations, locationUpdate)
	restate.Set[PackageInfo](ctx, PACKAGE_INFO, packageInfo)
	return nil
}

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
