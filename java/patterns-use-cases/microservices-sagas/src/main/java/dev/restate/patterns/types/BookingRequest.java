package dev.restate.patterns.types;

import dev.restate.patterns.activities.CarRentals;
import dev.restate.patterns.activities.Flights;
import dev.restate.patterns.clients.PaymentClient;

public record BookingRequest(
        Flights.FlightBookingRequest flights,
        CarRentals.CarRentalRequest car,
        PaymentClient.PaymentInfo paymentInfo
) {}

