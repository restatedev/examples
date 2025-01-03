package main

import (
	"context"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log/slog"
	"os"
)

type DataUploadService struct{}

func (DataUploadService) Run(ctx restate.WorkflowContext) (string, error) {
	url, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return createS3Bucket(), nil
	})
	if err != nil {
		return "", err
	}

	_, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return restate.Void{}, uploadData(url)
	})
	if err != nil {
		return "", err
	}

	err = restate.Promise[string](ctx, "url").Resolve(url)
	if err != nil {
		return "", err
	}

	return url, nil
}

func (DataUploadService) ResultAsEmail(ctx restate.WorkflowSharedContext, email string) error {
	slog.Info("Slow upload: client requested to be notified via email.")
	url, err := restate.Promise[string](ctx, "url").Result()
	if err != nil {
		return err
	}

	_, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return restate.Void{}, sendEmail(email, url)
	})
	return err
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(DataUploadService{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}
