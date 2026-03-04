package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	restate "github.com/restatedev/sdk-go"
	restateingress "github.com/restatedev/sdk-go/ingress"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

func main() {
	ctx := context.Background()

	exp, err := otlptrace.New(ctx, otlptracegrpc.NewClient(
		otlptracegrpc.WithInsecure(),
		otlptracegrpc.WithEndpoint("localhost:4317"),
	))
	if err != nil {
		log.Fatalf("failed to create OTLP exporter: %v", err)
	}
	res, err := resource.New(ctx,
		resource.WithAttributes(attribute.String("service.name", "otel-tracing-client")),
	)
	if err != nil {
		log.Fatalf("failed to create resource: %v", err)
	}
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithBatcher(exp),
		sdktrace.WithResource(res),
	)
	defer func() { _ = tp.Shutdown(ctx) }()

	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	name := "World"
	if len(os.Args) > 1 {
		name = os.Args[1]
	}

	tracer := otel.Tracer("client")
	ctx, span := tracer.Start(ctx, "client.Greet",
		trace.WithAttributes(attribute.String("name", name)),
	)
	defer span.End()

	// The otelhttp transport reads the active span from ctx and injects
	// traceparent into every outgoing HTTP request, so Restate's ingress
	// receives the trace context and creates its spans as children of client.Greet.
	client := restateingress.NewClient("http://localhost:8080",
		restate.WithHttpClient(&http.Client{
			Transport: otelhttp.NewTransport(http.DefaultTransport),
		}),
	)

	result, err := restateingress.Service[string, string](client, "Greeter", "Greet").
		Request(ctx, name)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		span.End()
		_ = tp.Shutdown(ctx)
		log.Fatalf("error: %v", err)
	}

	fmt.Printf("Result:  %s\n", result)
	fmt.Printf("Trace:   http://localhost:16686/trace/%s\n", span.SpanContext().TraceID())
}
