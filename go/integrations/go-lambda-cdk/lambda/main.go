package main

import (
	"log/slog"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
)

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(Greeter{}))

	handler, err := server.LambdaHandler()
	if err != nil {
		slog.Error("failed to create lambda handler", "err", err.Error())
		os.Exit(1)
	}

	lambda.Start(handler)
}
