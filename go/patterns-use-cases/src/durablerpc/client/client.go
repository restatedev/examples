package main

import (
	"flag"
	"fmt"
	"io"
	"log/slog"
	"net/http"
)

// This example sends HTTP call to Restate to submit a task
// Alternatively, to invoke a handler from within another Restate handler, use the Context methods instead!

const RESTATE_URL = "http://localhost:8080"

func ReserveProduct(productId string, reservationId string) {
	client := &http.Client{}

	// Durable RPC call to the product service
	// Restate registers the request and makes sure it runs to completion exactly once
	// This is a call to Virtual Object so we can be sure only one reservation is made concurrently
	url := fmt.Sprintf("%s/ProductService/%s/Book", RESTATE_URL, productId)
	req, err := http.NewRequest("POST", url, nil)
	if err != nil {
		slog.Error("Book product failed", "err", err.Error())
		return
	}
	// use a stable uuid as an idempotency key; Restate deduplicates for us
	req.Header.Set("idempotency-key", reservationId)

	resp, err := client.Do(req)
	if err != nil {
		slog.Error("Book product failed", "err", err.Error())
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		slog.Error("Book product failed", "err", err.Error())
		return
	}

	slog.Info("Response: " + string(body))
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
