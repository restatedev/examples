package main

import (
	"context"
	"flag"
	"log/slog"

	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/ingress"
)

// This example sends HTTP call to Restate to submit a task
// Alternatively, to invoke a handler from within another Restate handler, use the Context methods instead!

const RESTATE_URL = "http://localhost:8080"

func ReserveProduct(productId string, reservationId string) {
	ingressClient := ingress.NewClient(RESTATE_URL)

	result, err := ingress.Object[restate.Void, bool](ingressClient,
		"ProductService",
		productId,
		"Reserve").Request(context.Background(),
		restate.Void{},
		// use a stable uuid as an idempotency key; Restate deduplicates for us
		restate.WithIdempotencyKey(reservationId),
	)
	if err != nil {
		slog.Error("Book product failed", "err", err)
		return
	}

	slog.Info("Response", "response", result)
}

func main() {
	productId := flag.String("productId", "", "Product ID")
	reservationId := flag.String("reservationId", "", "Reservation ID")
	flag.Parse()

	if *productId == "" || *reservationId == "" {
		slog.Error("Product ID and Reservation ID must be provided")
		return
	}

	ReserveProduct(*productId, *reservationId)
}
