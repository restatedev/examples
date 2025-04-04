package activities

import (
	restate "github.com/restatedev/sdk-go"
	"log/slog"
)

type FlightBookingRequest struct {
	FlightId      string `json:"flight_id"`
	PassengerName string `json:"passenger_name"`
}

type FlightService struct{}

func (FlightService) Reserve(ctx restate.Context, _flightBookingRequest FlightBookingRequest) (string, error) {
	flightBookingId := restate.Rand(ctx).UUID().String()
	slog.Info("Flight reserved: " + flightBookingId)
	return flightBookingId, nil
}

func (FlightService) Confirm(ctx restate.Context, flightBookingId string) error {
	slog.Info("Flight confirmed: " + flightBookingId)
	return nil
}

func (FlightService) Cancel(ctx restate.Context, flightBookingId string) error {
	slog.Info("Flight cancelled: " + flightBookingId)
	return nil
}
