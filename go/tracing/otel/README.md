# End-to-End OpenTelemetry Tracing with Restate (Go)

Demonstrates a fully connected distributed trace across:

```
Client --[http]-> Restate --> Greeter service --[RPC]--> Downstream handler
```

## Key patterns

### 1. Client → Restate ingress

Wrap the ingress HTTP client with `otelhttp.NewTransport()`. This reads the active
span from the Go context and injects `traceparent` into every outgoing request.
Restate's ingress receives the header and creates its own spans as children of the
client span automatically.

```go
client := restateingress.NewClient("http://localhost:8080",
    restate.WithHttpClient(&http.Client{
        Transport: otelhttp.NewTransport(http.DefaultTransport),
    }),
)

ctx, span := tracer.Start(ctx, "client.Greet")
restateingress.Service[string, string](client, "Greeter", "Greet").Request(ctx, name)
````

### 2. In-handler span creation

The Restate SDK automatically extracts `traceparent` from the inbound HTTP headers,
so `ctx` already has the correct parent when your handler runs. `tracer.Start`
returns a plain `context.Context` (`greetCtx`) — use `WrapContext` to put it back
inside the Restate context so that subsequent SDK calls see the active span.

```go
func (Greeter) Greet(ctx restate.Context, name string) (string, error) {
    greetCtx, span := tracer.Start(ctx, "Greeter.Greet")
    defer span.End()
    ctx = restate.WrapContext(ctx, greetCtx)
    ...
}
```

### 3. Calling a downstream Restate service

When using Restate **service-to-service RPC**, propagate the trace context as follows:

```go
carrier := propagation.MapCarrier{}
otel.GetTextMapPropagator().Inject(greetCtx, carrier)

restate.Object[string](ctx, "Downstream", name, "Process").
    Request(restate.Void{}, restate.WithHeaders(map[string]string(carrier)))
```

Restate forwards these headers to the downstream handler's context.
The Go SDK server then extracts them, giving the downstream handler the correct
parent span automatically — no changes needed in the downstream handler itself.

## Running the example

### 1. Start Jaeger

```bash
docker run -d --name jaeger \
  -p 4317:4317 \
  -p 16686:16686 \
  jaegertracing/all-in-one:latest
```

### 2. Start Restate with tracing enabled

```bash
npx @restatedev/restate-server --tracing-endpoint http://localhost:4317
```

### 3. Start the services

```bash
go run ./service/
```

### 4. Register with Restate

```bash
npx @restatedev/restate deployments register http://localhost:9080
```

### 5. Run the client

```bash
go run ./client/ Alice
```

The client prints a direct Jaeger link to the complete trace:

```
Result:  Hello, Alice! (downstream: processed-Alice)
Trace:   http://localhost:16686/trace/<trace-id>
```

## Files

- `service/main.go` — OTEL setup, starts both services on `:9080`
- `service/greeter.go` — Greeter handler; injects trace headers for downstream call
- `service/downstream.go` — Downstream handler; trace context arrives via headers
- `client/main.go` — external caller with `otelhttp` transport and root span
