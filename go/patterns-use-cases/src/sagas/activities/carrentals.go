package activities

import (
	restate "github.com/restatedev/sdk-go"
	"log/slog"
)

type CarBookingRequest struct {
	PickupLocation string `json:"pickup_location"`
	RentalDate     string `json:"rental_date"`
}

type CarRentals struct{}

func (CarRentals) Reserve(ctx restate.Context, _carBookingRequest CarBookingRequest) (string, error) {
	carBookingId := restate.Rand(ctx).UUID().String()
	slog.Info("Car reserved: " + carBookingId)
	return carBookingId, nil
}

func (CarRentals) Confirm(ctx restate.Context, carBookingId string) error {
	slog.Info("Car confirmed: " + carBookingId)
	return nil
}

func (CarRentals) Cancel(ctx restate.Context, carBookingId string) error {
	slog.Info("Car cancelled: " + carBookingId)
	return nil
}
