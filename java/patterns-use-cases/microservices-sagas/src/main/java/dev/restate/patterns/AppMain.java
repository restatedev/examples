package dev.restate.patterns;

import dev.restate.patterns.activities.CarRentals;
import dev.restate.patterns.activities.Flights;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;

public class AppMain {
    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
                .bind(new BookingWorkflow())
                .bind(new CarRentals())
                .bind(new Flights())
                .buildAndListen();
    }
}
