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

type PackageTracker struct{}

func (PackageTracker) RegisterPackage(ctx restate.ObjectContext, packageInfo PackageInfo) error {
	restate.Set[PackageInfo](ctx, "package-info", packageInfo)
	return nil
}

func (PackageTracker) UpdateLocation(ctx restate.ObjectContext, locationUpdate LocationUpdate) error {
	packageInfo, err := restate.Get[*PackageInfo](ctx, "package-info")
	if err != nil {
		return err
	}
	if packageInfo == nil {
		return restate.TerminalError(errors.New("package not found"))
	}

	packageInfo.Locations = append(packageInfo.Locations, locationUpdate)
	restate.Set[PackageInfo](ctx, "package-info", *packageInfo)
	return nil
}

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
