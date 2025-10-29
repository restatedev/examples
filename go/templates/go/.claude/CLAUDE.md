# Restate Go SDK Rules

## Core Concepts

* Restate provides durable execution: code automatically stores completed steps and resumes from where it left off on failures
* All handlers receive a `Context`/`ObjectContext`/`WorkflowContext`/`ObjectSharedContext`/`WorkflowSharedContext` object as the first argument
* Handlers can take typed inputs and return typed outputs using Go structs and JSON serialization

## Service Types

### Basic Services

```go {"CODE_LOAD::go/develop/myservice/main.go"}  theme={null}
package main

import (
  "context"
  "fmt"
  "log"

  restate "github.com/restatedev/sdk-go"
  server "github.com/restatedev/sdk-go/server"
)

type MyService struct{}

func (MyService) MyHandler(ctx restate.Context, greeting string) (string, error) {
  return fmt.Sprintf("%s!", greeting), nil
}

func main() {
  if err := server.NewRestate().
    Bind(restate.Reflect(MyService{})).
    Start(context.Background(), "0.0.0.0:9080"); err != nil {
    log.Fatal(err)
  }
}
```

### Virtual Objects (Stateful, Key-Addressable)

```go {"CODE_LOAD::go/develop/myvirtualobject/main.go"}  theme={null}
package main

import (
  "context"
  "fmt"
  "log"

  restate "github.com/restatedev/sdk-go"
  server "github.com/restatedev/sdk-go/server"
)

type MyObject struct{}

func (MyObject) MyHandler(ctx restate.ObjectContext, greeting string) (string, error) {
  return fmt.Sprintf("%s %s!", greeting, restate.Key(ctx)), nil
}

func (MyObject) MyConcurrentHandler(ctx restate.ObjectSharedContext, greeting string) (string, error) {
  return fmt.Sprintf("%s %s!", greeting, restate.Key(ctx)), nil
}

func main() {
  if err := server.NewRestate().
    Bind(restate.Reflect(MyObject{})).
    Start(context.Background(), "0.0.0.0:9080"); err != nil {
    log.Fatal(err)
  }
}
```

### Workflows

```go {"CODE_LOAD::go/develop/myworkflow/main.go"}  theme={null}
package myworkflow

import (
  "context"
  restate "github.com/restatedev/sdk-go"
  "github.com/restatedev/sdk-go/server"
  "log/slog"
  "os"
)

type MyWorkflow struct{}

func (MyWorkflow) Run(ctx restate.WorkflowContext, req string) (string, error) {
  // implement the workflow logic here
  return "success", nil
}

func (MyWorkflow) InteractWithWorkflow(ctx restate.WorkflowSharedContext) error {
  // implement interaction logic here
  // e.g. resolve a promise that the workflow is waiting on
  return nil
}

func main() {
  server := server.NewRestate().
    Bind(restate.Reflect(MyWorkflow{}))

  if err := server.Start(context.Background(), ":9080"); err != nil {
    slog.Error("application exited unexpectedly", "err", err.Error())
    os.Exit(1)
  }
}
```

## Context Operations

### State Management (Virtual Objects & Workflows only)

❌ Never use global variables - not durable, lost across replicas.
✅ Use `restate.Get()` and `restate.Set()` - durable and scoped to the object's key.

```go {"CODE_LOAD::go/develop/agentsmd/actions.go#state"}  theme={null}
// Get state keys
stateKeys, err := restate.Keys(ctx)
if err != nil {
  return err
}
_ = stateKeys

// Get state
myString := "my-default"
if s, err := restate.Get[*string](ctx, "my-string-key"); err != nil {
  return err
} else if s != nil {
  myString = *s
}

count, err := restate.Get[int](ctx, "count")
if err != nil {
  return err
}

// Set state
restate.Set(ctx, "my-key", "my-new-value")
restate.Set(ctx, "count", count+1)

// Clear state
restate.Clear(ctx, "my-key")
restate.ClearAll(ctx)
```

### Service Communication

#### Request-Response

```go {"CODE_LOAD::go/develop/agentsmd/actions.go#service_calls"}  theme={null}
// Call a Service
svcResponse, err := restate.Service[string](ctx, "MyService", "MyHandler").
  Request(request)
if err != nil {
  return err
}

// Call a Virtual Object
objResponse, err := restate.Object[string](ctx, "MyObject", objectKey, "MyHandler").
  Request(request)
if err != nil {
  return err
}

// Call a Workflow
wfResponse, err := restate.Workflow[string](ctx, "MyWorkflow", workflowId, "Run").
  Request(request)
if err != nil {
  return err
}
```

#### One-Way Messages

```go {"CODE_LOAD::go/develop/agentsmd/actions.go#sending_messages"}  theme={null}
// Send to service
restate.ServiceSend(ctx, "MyService", "MyHandler").Send(request)

// Send to virtual object
restate.ObjectSend(ctx, "MyObject", objectKey, "MyHandler").Send(request)

// Send to workflow
restate.WorkflowSend(ctx, "MyWorkflow", workflowId, "Run").Send(request)
```

#### Delayed Messages

```go {"CODE_LOAD::go/develop/agentsmd/actions.go#delayed_messages"}  theme={null}
restate.ServiceSend(ctx, "MyService", "MyHandler").Send(request, restate.WithDelay(5*time.Hour))
```

### Run Actions or Side Effects (Non-Deterministic Operations)

❌ Never call external APIs/DBs directly - will re-execute during replay, causing duplicates.
✅ Wrap in `restate.Run()` - Restate journals the result; runs only once.

```go {"CODE_LOAD::go/develop/agentsmd/actions.go#durable_steps"}  theme={null}
// Wrap non-deterministic code in restate.Run
result, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
  return callExternalAPI(), nil
})
if err != nil {
  return err
}
```

### Deterministic randoms and time

❌ Never use `rand.Float64()` - non-deterministic and breaks replay logic.
✅ Use `restate.Rand()` or `restate.UUID()` - Restate journals the result for deterministic replay.

```go {"CODE_LOAD::go/develop/journalingresults.go#uuid"}  theme={null}
uuid := restate.UUID(ctx)
```

```go {"CODE_LOAD::go/develop/journalingresults.go#random_nb"}  theme={null}
randomInt := restate.Rand(ctx).Uint64()
randomFloat := restate.Rand(ctx).Float64()
mathRandV2 := rand.New(restate.RandSource(ctx))
```

❌ Never use `time.Now()` - returns different values during replay.
✅ Wrap `time.Now()` in `restate.Run` to let Restate record the timestamp.

### Durable Timers and Sleep

❌ Never use `time.Sleep()` or timers - not durable, lost on restarts.
✅ Use `restate.Sleep()` - durable timer that survives failures.

```go {"CODE_LOAD::go/develop/agentsmd/actions.go#durable_timers"}  theme={null}
// Sleep
err := restate.Sleep(ctx, 30*time.Second)
if err != nil {
  return err
}

// Schedule delayed call (different from sleep + send)
restate.ServiceSend(ctx, "MyService", "MyHandler").
  Send("Hi", restate.WithDelay(5*time.Hour))
```

### Awakeables (External Events)

```go {"CODE_LOAD::go/develop/agentsmd/actions.go#awakeables"}  theme={null}
// Create awakeable
awakeable := restate.Awakeable[string](ctx)
awakeableId := awakeable.Id()

// Send ID to external system
if _, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
  return requestHumanReview(name, awakeableId), nil
}); err != nil {
  return err
}

// Wait for result
review, err := awakeable.Result()
if err != nil {
  return err
}

// Resolve from another handler
restate.ResolveAwakeable(ctx, awakeableId, "Looks good!")

// Reject from another handler
restate.RejectAwakeable(ctx, awakeableId, fmt.Errorf("Cannot be reviewed"))
```

### Durable Promises (Workflows only)

```go {"CODE_LOAD::go/develop/agentsmd/actions.go#workflow_promises"}  theme={null}
// Wait for promise
promise := restate.Promise[string](ctx, "review")
review, err := promise.Result()
if err != nil {
  return err
}

// Resolve promise from another handler
err = restate.Promise[string](ctx, "review").Resolve(review)
if err != nil {
  return err
}
```

## Concurrency

Always use Restate `Wait*` functions instead of Go's native goroutines and channels - they journal execution order for deterministic replay.

### Select the first successful completion

```go {"CODE_LOAD::go/develop/journalingresults.go#race"}  theme={null}
sleepFuture := restate.After(ctx, 30*time.Second)
callFuture := restate.Service[string](ctx, "MyService", "MyHandler").RequestFuture("hi")

fut, err := restate.WaitFirst(ctx, sleepFuture, callFuture)
if err != nil {
  return "", err
}
switch fut {
case sleepFuture:
  if err := sleepFuture.Done(); err != nil {
    return "", err
  }
  return "sleep won", nil
case callFuture:
  result, err := callFuture.Response()
  if err != nil {
    return "", err
  }
  return fmt.Sprintf("call won with result: %s", result), nil
}
```

### Wait for all tasks to complete

```go {"CODE_LOAD::go/develop/journalingresults.go#all"}  theme={null}
callFuture1 := restate.Service[string](ctx, "MyService", "MyHandler").RequestFuture("hi")
callFuture2 := restate.Service[string](ctx, "MyService", "MyHandler").RequestFuture("hi again")

// Collect all results
var subResults []string
for fut, err := range restate.Wait(ctx, callFuture1, callFuture2) {
  if err != nil {
    return "", err
  }
  response, err := fut.(restate.ResponseFuture[string]).Response()
  if err != nil {
    return "", err
  }
  subResults = append(subResults, response)
}
```

### Invocation Management

```go {"CODE_LOAD::go/develop/agentsmd/actions.go#cancel"}  theme={null}
invocationId := restate.
  ServiceSend(ctx, "MyService", "MyHandler").
  // Optional: send attaching idempotency key
  Send("Hi", restate.WithIdempotencyKey("my-idempotency-key")).
  GetInvocationId()

// Later re-attach to the request
response, err := restate.AttachInvocation[string](ctx, invocationId).Response()
if err != nil {
  return err
}

// I don't need this invocation anymore, let me just cancel it
restate.CancelInvocation(ctx, invocationId)
```

## Error Handling

Restate retries failures indefinitely by default. For permanent business-logic failures (invalid input, declined payment), use TerminalError to stop retries immediately.

### Terminal Errors (No Retry)

```go {"CODE_LOAD::go/develop/errorhandling.go#here"}  theme={null}
return restate.TerminalError(fmt.Errorf("Something went wrong."), 500)
```

### Retryable Errors

```go  theme={null}
// Any other error will be retried
return fmt.Errorf("Temporary failure - will retry")
```

## SDK Clients (External Invocations)

```go {"CODE_LOAD::go/develop/agentsmd/clients.go#here"}  theme={null}
restateClient := restateingress.NewClient("http://localhost:8080")

// Request-response
result, err := restateingress.Service[string, string](
  restateClient, "MyService", "MyHandler").
  Request(context.Background(), "Hi")
if err != nil {
  // handle error
}

// One-way
restateingress.ServiceSend[string](
  restateClient, "MyService", "MyHandler").
  Send(context.Background(), "Hi")

// Delayed
restateingress.ServiceSend[string](
  restateClient, "MyService", "MyHandler").
  Send(context.Background(), "Hi", restate.WithDelay(1*time.Hour))
```
