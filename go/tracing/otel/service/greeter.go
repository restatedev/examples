package main

import (
	"fmt"

	restate "github.com/restatedev/sdk-go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
)

var greeterTracer = otel.Tracer("greeter")

type Greeter struct{}

func (Greeter) Greet(ctx restate.Context, name string) (string, error) {
	// ctx already carries the W3C trace context that Restate extracted from
	// the inbound HTTP request headers (traceparent / tracestate).
	// Starting a span here makes it a child of Restate's own invoke span.
	greetCtx, span := greeterTracer.Start(ctx, "Greeter.Greet",
		trace.WithAttributes(attribute.String("name", name)),
	)
	// Thread the updated OTEL context back into the Restate context so that
	// downstream SDK calls (which read from ctx) see the current active span.
	ctx = restate.WrapContext(ctx, greetCtx)
	defer span.End()

	// To connect the downstream Restate handler's spans to this trace we must
	// manually inject the current trace context into the call headers.
	// ctx.Object() / ctx.Service() go through Restate's state-machine protocol,
	// not a plain HTTP client, so otelhttp cannot inject headers automatically.
	carrier := propagation.MapCarrier{}
	otel.GetTextMapPropagator().Inject(greetCtx, carrier)

	result, err := restate.Object[string](ctx, "Downstream", name, "Process").
		Request(restate.Void{}, restate.WithHeaders(map[string]string(carrier)))
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	return fmt.Sprintf("Hello, %s! (downstream: %s)", name, result), nil
}
