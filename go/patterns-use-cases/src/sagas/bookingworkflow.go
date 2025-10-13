package main

import (
	"context"
	"log"
	"slices"

	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
)

type BookingRequest struct {
	CustomerId string            `json:"customerId"`
	Flight     FlightRequest     `json:"flight"`
	Car        CarBookingRequest `json:"car"`
	Hotel      HotelRequest      `json:"hotel"`
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
| 1. Add Cancel Flight Compensation          |
| 2. Book Flight                             |
|    If TerminalError: Run Compensations     |
| 3. Add Cancel Car Compensation             |
| 4. Book Car                                |
|    If TerminalError: Run Compensations     |
| 5. Add Cancel Hotel Compensation           |
| 6. Book Hotel                              |
|    If TerminalError: Run Compensations     |
+--------------------------------------------+

Note: that the compensation logic is purely implemented in user code (no special Restate API)
*/

type BookingWorkflow struct{}

func (BookingWorkflow) Run(ctx restate.Context, req BookingRequest) (err error) {

	// Create a list of undo actions
	var compensations []func() (restate.Void, error)

	// Run compensations at the end if err != nil
	defer func() {
		if err != nil {
			for _, compensation := range slices.Backward(compensations) {
				if _, compErr := compensation(); compErr != nil {
					err = compErr
				}
			}
		}
	}()

	compensations = append(compensations, func() (restate.Void, error) {
		return restate.Run(ctx,
			func(ctx restate.RunContext) (restate.Void, error) {
				return CancelFlight(req.CustomerId)
			},
			restate.WithName("Cancel flight"),
		)
	})
	if _, err = restate.Run(ctx,
		func(ctx restate.RunContext) (restate.Void, error) {
			return BookFlight(req.CustomerId, req.Flight)
		},
		restate.WithName("Book flight"),
	); err != nil {
		return err
	}

	compensations = append(compensations, func() (restate.Void, error) {
		return restate.Run(ctx,
			func(ctx restate.RunContext) (restate.Void, error) {
				return CancelCar(req.CustomerId)
			},
			restate.WithName("Cancel car"),
		)
	})
	if _, err = restate.Run(ctx,
		func(ctx restate.RunContext) (restate.Void, error) {
			return BookCar(req.CustomerId, req.Car)
		},
		restate.WithName("Book car"),
	); err != nil {
		return err
	}

	compensations = append(compensations, func() (restate.Void, error) {
		return restate.Run(ctx,
			func(ctx restate.RunContext) (restate.Void, error) {
				return CancelHotel(req.CustomerId)
			},
			restate.WithName("Cancel hotel"),
		)
	})
	if _, err = restate.Run(ctx,
		func(ctx restate.RunContext) (restate.Void, error) {
			return BookHotel(req.CustomerId, req.Hotel)
		},
		restate.WithName("Book hotel"),
	); err != nil {
		return err
	}

	return nil
}

func main() {
	if err := server.NewRestate().
		Bind(restate.Reflect(BookingWorkflow{})).
		Start(context.Background(), ":9080"); err != nil {
		log.Fatal(err)
	}
}
