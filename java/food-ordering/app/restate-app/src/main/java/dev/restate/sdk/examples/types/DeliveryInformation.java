package dev.restate.sdk.examples.types;

public class DeliveryInformation {
    String orderId;
    String callbackId;
    String restaurantId;
    Location restaurantLocation;
    Location customerLocation;
    boolean orderPickedUp;

    public DeliveryInformation(String orderId, String callbackId, String restaurantId, Location restaurantLocation, Location customerLocation, boolean orderPickedUp) {
        this.orderId = orderId;
        this.callbackId = callbackId;
        this.restaurantId = restaurantId;
        this.restaurantLocation = restaurantLocation;
        this.customerLocation = customerLocation;
        this.orderPickedUp = orderPickedUp;
    }

    public DeliveryInformation() {}

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getCallbackId() {
        return callbackId;
    }

    public void setCallbackId(String callbackId) {
        this.callbackId = callbackId;
    }

    public String getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(String restaurantId) {
        this.restaurantId = restaurantId;
    }

    public Location getRestaurantLocation() {
        return restaurantLocation;
    }

    public void setRestaurantLocation(Location restaurantLocation) {
        this.restaurantLocation = restaurantLocation;
    }

    public Location getCustomerLocation() {
        return customerLocation;
    }

    public void setCustomerLocation(Location customerLocation) {
        this.customerLocation = customerLocation;
    }

    public boolean isOrderPickedUp() {
        return orderPickedUp;
    }

    public void setOrderPickedUp(boolean orderPickedUp) {
        this.orderPickedUp = orderPickedUp;
    }
}
