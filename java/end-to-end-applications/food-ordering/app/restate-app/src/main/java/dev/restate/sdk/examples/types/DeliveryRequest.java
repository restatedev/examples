package dev.restate.sdk.examples.types;

public class DeliveryRequest {

  private final String restaurantId;
  private final String callback;

  public DeliveryRequest(String restaurantId, String callback) {
    this.restaurantId = restaurantId;
    this.callback = callback;
  }

  public String getRestaurantId() {
    return restaurantId;
  }

  public String getCallback() {
    return callback;
  }
}
