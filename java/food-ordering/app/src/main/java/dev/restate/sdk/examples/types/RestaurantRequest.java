package dev.restate.sdk.examples.types;

public class RestaurantRequest {
    public String callbackId;
    public String orderId;

    public RestaurantRequest(String callbackId, String orderId) {
        this.callbackId = callbackId;
        this.orderId = orderId;
    }
}
