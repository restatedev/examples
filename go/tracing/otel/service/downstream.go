package main

import (
	"fmt"

	restate "github.com/restatedev/sdk-go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

var downstreamTracer = otel.Tracer("downstream")

type Downstream struct{}

// Process receives trace context forwarded by Restate from the headers
// Greeter injected via restate.WithHeaders(), so ctx already has the
// correct parent span — no extra extraction needed here.
func (Downstream) Process(ctx restate.ObjectContext, _ restate.Void) (string, error) {
	name := restate.Key(ctx)

	_, span := downstreamTracer.Start(ctx, "Downstream.Process",
		trace.WithAttributes(attribute.String("name", name)),
	)
	defer span.End()

	return fmt.Sprintf("processed-%s", name), nil
}
