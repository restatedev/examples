package main

import (
	"context"
	"fmt"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log/slog"
	"os"
)

const COUNTER_KEY = "counter"

// Virtual Objects are services that hold K/V state. Its handlers interact with the object state.
// An object is identified by a unique id - only one object exists per id.
//
// Handlers are stateless executors.
// Restate proxies requests to it and attaches the object's state to the request.
// Virtual Objects then have their K/V state locally accessible without requiring any database
// connection or lookup. State is exclusive, and atomically committed with the
// method execution. It is always consistent with the progress of the execution.
//
// Virtual Objects are Stateful (Serverless) constructs.
//

type GreeterObject struct{}

func (GreeterObject) Greet(ctx restate.ObjectContext, req struct{ Greeting string }) (string, error) {
	// Access the state attached to this object (this 'name')
	// State access and updates are exclusive and consistent with the execution progress.
	count, err := restate.Get[int64](ctx, COUNTER_KEY)
	if err != nil {
		return "", err
	}
	count++
	restate.Set(ctx, COUNTER_KEY, count)
	return fmt.Sprintf("%s %s for the %d-th time.", req.Greeting, restate.Key(ctx), count), nil
}

func (GreeterObject) Ungreet(ctx restate.ObjectContext) (string, error) {
	count, err := restate.Get[int64](ctx, COUNTER_KEY)
	if err != nil {
		return "", err
	}
	if count > 0 {
		count--
		restate.Set(ctx, COUNTER_KEY, count)
	}
	return fmt.Sprintf("Dear %s, taking one greeting back: %d.", restate.Key(ctx), count), nil
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(GreeterObject{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}

/*
You specify which object you want to invoke by including its key in the URL path:
localhost:8080/objectName/key/handlerName

Check the README to learn how to run Restate.
Then, invoke handlers via HTTP:

  curl localhost:8080/GreeterObject/mary/Greet -H 'content-type: application/json' -d '{ "greeting" : "Hi" }'
  --> "Hi mary for the 1-th time."

  curl localhost:8080/GreeterObject/barack/Greet -H 'content-type: application/json' -d '{ "greeting" : "Hello" }'
  --> "Hello barack for the 1-th time."

  curl -X POST localhost:8080/GreeterObject/mary/Ungreet
  --> "Dear mary, taking one greeting back: 0."

*/
