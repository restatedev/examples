package main

import (
	"errors"
	restate "github.com/restatedev/sdk-go"
	"log/slog"
)

type CarBookingRequest struct {
	PickupLocation string `json:"pickup_location"`
	RentalDate     string `json:"rental_date"`
}

type FlightRequest struct {
	FlightId      string `json:"flight_id"`
	PassengerName string `json:"passenger_name"`
}

type HotelRequest struct {
	ArrivalDate   string `json:"arrivalDate"`
	DepartureDate string `json:"departureDate"`
}

func BookCar(customerId string, _req CarBookingRequest) (restate.Void, error) {
	slog.Info("Car reserved for customer: " + customerId)
	return restate.Void{}, nil
}

func CancelCar(customerId string) (restate.Void, error) {
	slog.Info("Car cancelled for customer:" + customerId)
	return restate.Void{}, nil
}

func BookFlight(customerId string, _req FlightRequest) (restate.Void, error) {
	slog.Info("Flight reserved for customer: " + customerId)
	return restate.Void{}, nil
}

func CancelFlight(customerId string) (restate.Void, error) {
	slog.Info("Flight cancelled for customer:" + customerId)
	return restate.Void{}, nil
}

func BookHotel(customerId string, _req HotelRequest) (restate.Void, error) {
	slog.Error("[👻 SIMULATED] This hotel is fully booked!")
	return restate.Void{}, restate.TerminalError(errors.New("[👻 SIMULATED] This hotel is fully booked!"))
}

func CancelHotel(customerId string) (restate.Void, error) {
	slog.Info("Hotel cancelled for customer:" + customerId)
	return restate.Void{}, nil
}
