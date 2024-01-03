package dev.restate.sdk.examples.types;

public class AssignedDelivery {

    public String driverId;
    public String orderId;
    public String restaurantId;
    public Location restaurantLocation;
    public Location customerLocation;

    public AssignedDelivery(String driverId, String orderId, String restaurantId, Location restaurantLocation, Location customerLocation) {
        this.driverId = driverId;
        this.orderId = orderId;
        this.restaurantId = restaurantId;
        this.restaurantLocation = restaurantLocation;
        this.customerLocation = customerLocation;
    }

    public AssignedDelivery() {
    }
}
