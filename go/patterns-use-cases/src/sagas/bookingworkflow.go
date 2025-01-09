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

// Trip reservation workflow using sagas:
// For some types of failures, we do not want to retry but instead undo the previous actions and finish.
//
// You can use Durable Execution to execute actions and track their undo equivalents (compensations) in a list.
// When a terminal error occurs, Durable Execution ensures execution of all compensations.
//
// Note: that the compensation logic is purely implemented in user code (no special Restate API)

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
NOTE: Depending on the characteristics of the API/system you interact with, you add the compensation at a different time:
1. **Two-phase commit**: For APIs like flights and cars, you first create a reservation and get an ID.
You then confirm or cancel using this ID. Add the compensation after creating the reservation.

2. **Idempotency key**: For APIs like payments, you generate a UUID and perform the action in one step.
Add the compensation before performing the action, using the same UUID.
*/
