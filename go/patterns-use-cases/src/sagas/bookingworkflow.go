package main

import (
	"context"
	"github.com/restatedev/examples/go/patterns-use-cases/src/sagas/activities"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log/slog"
	"os"
)

type BookingRequest struct {
	Flights     activities.FlightBookingRequest `json:"flights"`
	Car         activities.CarBookingRequest    `json:"car"`
	PaymentInfo activities.PaymentInfo          `json:"payment_info"`
}

type BookingWorkflow struct{}

func (BookingWorkflow) Run(ctx restate.WorkflowContext, req BookingRequest) error {
	// create a list of undo actions
	compensations := make([]func() error, 0, 3)

	// Reserve the flights and let Restate remember the reservation ID
	flightBookingID, err := restate.Service[string](ctx, "Flights", "Reserve").Request(req.Flights)
	if err != nil {
		return err
	}

	// Register the undo action for the flight reservation.
	compensations = append(compensations, func() error {
		_, err := restate.Service[restate.Void](ctx, "Flights", "Cancel").Request(flightBookingID)
		return err
	})

	// Reserve the car and let Restate remember the reservation ID
	carBookingID, err := restate.Service[string](ctx, "CarRentals", "Reserve").Request(req.Car)
	if err != nil {
		if restate.IsTerminalError(err) {
			return runCompensations(compensations)
		}
		return err
	}
	// Register the undo action for the car rental.
	compensations = append(compensations, func() error {
		_, err := restate.Service[restate.Void](ctx, "CarRentals", "Cancel").Request(carBookingID)
		return err
	})

	// Generate an idempotency key for the payment
	paymentID := restate.Rand(ctx).UUID().String()

	// Register the refund as a compensation, using the idempotency key
	compensations = append(compensations, func() error {
		_, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, activities.PaymentClient{}.Refund(paymentID)
		})
		return err
	})

	// Do the payment using the idempotency key
	if _, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return restate.Void{}, activities.PaymentClient{}.Charge(paymentID, req.PaymentInfo)
	}); err != nil {
		if restate.IsTerminalError(err) {
			return runCompensations(compensations)
		}
		return err
	}

	// Confirm the flight and car reservations
	if _, err = restate.Service[restate.Void](ctx, "Flights", "Confirm").Request(flightBookingID); err != nil {
		return err
	}
	_, err = restate.Service[restate.Void](ctx, "CarRentals", "Confirm").Request(carBookingID)
	return err
}

func runCompensations(compensations []func() error) error {
	for _, compensation := range compensations {
		if err := compensation(); err != nil {
			return err
		}
	}
	return nil
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(BookingWorkflow{})).
		Bind(restate.Reflect(activities.CarRentals{})).
		Bind(restate.Reflect(activities.Flights{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}

/*
curl -X POST localhost:8080/BookingWorkflow/trip123/Run -H 'content-type: application/json' -d '{
  "flights": {
    "flight_id": "12345",
    "passenger_name": "John Doe"
  },
  "car": {
    "pickup_location": "Airport",
    "rental_date": "2024-12-16"
  },
  "payment_info": {
    "card_number": "4111111111111111",
    "amount": 1500
  }
}'
*/
