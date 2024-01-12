package dev.restate.sdk.examples.types;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class AssignedDelivery {

  private final String driverId;
  private final String orderId;
  private final String restaurantId;
  private final Location restaurantLocation;
  private final Location customerLocation;
  private boolean orderPickedUp = false;

  @JsonCreator
  public AssignedDelivery(
      @JsonProperty("driverId") String driverId,
      @JsonProperty("orderId") String orderId,
      @JsonProperty("restaurantId") String restaurantId,
      @JsonProperty("restaurantLocation") Location restaurantLocation,
      @JsonProperty("customerLocation") Location customerLocation) {
    this.driverId = driverId;
    this.orderId = orderId;
    this.restaurantId = restaurantId;
    this.restaurantLocation = restaurantLocation;
    this.customerLocation = customerLocation;
  }

  public String getDriverId() {
    return driverId;
  }

  public String getOrderId() {
    return orderId;
  }

  public String getRestaurantId() {
    return restaurantId;
  }

  public Location getRestaurantLocation() {
    return restaurantLocation;
  }

  public Location getCustomerLocation() {
    return customerLocation;
  }

  public boolean isOrderPickedUp() {
    return orderPickedUp;
  }

  public void notifyPickup() {
    orderPickedUp = true;
  }
}
