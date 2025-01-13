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

/*
Trip reservation workflow using sagas:
Restate infinitely retries failures, and recovers previous progress.
For some types of failures, we don't want to retry but want to undo the previous actions and finish.

Restate guarantees the execution of your code. This makes it very easy to implement sagas.
We execute actions, and keep track of a list of undo actions.
When a terminal error occurs (an error we do not want to retry), Restate ensures execution of all compensations.

+------ Initialize compensations list ------+
                     |
                     v
+--------------------------------------------+
| 1. Reserve Flight                         |
| 2. Add Cancel Flight Compensation         |
| 3. Reserve Car                            |
|    If TerminalError: Run Compensations    |
| 4. Add Cancel Car Compensation            |
| 5. Generate Payment ID                    |
| 6. Add Refund Compensation                |
| 7. Perform Payment                        |
|    If TerminalError: Run Compensations    |
| 8. Confirm Flight Reservation             |
|    If TerminalError: Run Compensations    |
| 9. Confirm Car Reservation                |
|    If TerminalError: Run Compensations    |
+--------------------------------------------+

Note: that the compensation logic is purely implemented in user code (no special Restate API)
*/

type BookingWorkflow struct{}

func (BookingWorkflow) Run(ctx restate.WorkflowContext, req BookingRequest) error {
	// Create a list of undo actions
	compensations := make([]func() error, 0, 3)
	addCompensation := func(compensation func() error) {
		compensations = append(compensations, compensation)
	}

	handleError := func(err error) error {
		// Terminal errors tell Restate not to retry, but to compensate and fail the workflow
		if restate.IsTerminalError(err) {
			// Undo all the steps up to this point by running the compensations
			// Restate guarantees that all compensations are executed
			for _, compensation := range compensations {
				if err := compensation(); err != nil {
					return err
				}
			}
		}
		return err
	}

	// Reserve the flights; Restate remembers the reservation ID
	// This sends an HTTP request via Restate to the Restate flight service
	flightBookingID, err := restate.Service[string](ctx, "FlightService", "Reserve").Request(req.Flights)
	if err != nil {
		return err
	}

	// Use the flightBookingId to register the undo action for the flight reservation,
	// or later confirm the reservation.
	addCompensation(func() error {
		_, err := restate.Service[restate.Void](ctx, "FlightService", "Cancel").Request(flightBookingID)
		return err
	})

	// Reserve the car and let Restate remember the reservation ID
	carBookingID, err := restate.Service[string](ctx, "CarRentalService", "Reserve").Request(req.Car)
	if err != nil {
		return handleError(err)
	}
	// Register the undo action for the car rental.
	addCompensation(func() error {
		_, err := restate.Service[restate.Void](ctx, "CarRentalService", "Cancel").Request(carBookingID)
		return err
	})

	// Charge the payment; Generate a payment ID and store it in Restate
	paymentID := restate.Rand(ctx).UUID().String()

	// Register the refund as a compensation, using the idempotency key
	addCompensation(func() error {
		_, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
			return restate.Void{}, activities.PaymentClient{}.Refund(paymentID)
		})
		return err
	})

	// Do the payment using the idempotency key
	if _, err = restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return restate.Void{}, activities.PaymentClient{}.Charge(paymentID, req.PaymentInfo)
	}); err != nil {
		return handleError(err)
	}

	// Confirm the flight and car reservations
	if _, err = restate.Service[restate.Void](ctx, "FlightService", "Confirm").Request(flightBookingID); err != nil {
		return handleError(err)
	}
	if _, err = restate.Service[restate.Void](ctx, "CarRentalService", "Confirm").Request(carBookingID); err != nil {
		return handleError(err)
	}

	return nil
}

func main() {
	server := server.NewRestate().
		Bind(restate.Reflect(BookingWorkflow{})).
		Bind(restate.Reflect(activities.CarRentalService{})).
		Bind(restate.Reflect(activities.FlightService{}))

	if err := server.Start(context.Background(), ":9080"); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}
