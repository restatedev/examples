package dev.restate.sdk.examples.types;

import java.util.Objects;

public class AssignDeliveryRequest {
  private final String orderId;
  private final String restaurantId;
  private final Location restaurantLocation;
  private final Location customerLocation;

  public AssignDeliveryRequest(
      String orderId, String restaurantId, Location restaurantLocation, Location customerLocation) {
    this.orderId = orderId;
    this.restaurantId = restaurantId;
    this.restaurantLocation = restaurantLocation;
    this.customerLocation = customerLocation;
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

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;

    AssignDeliveryRequest that = (AssignDeliveryRequest) o;
    return Objects.equals(orderId, that.orderId)
        && Objects.equals(restaurantId, that.restaurantId)
        && Objects.equals(restaurantLocation, that.restaurantLocation)
        && Objects.equals(customerLocation, that.customerLocation);
  }

  @Override
  public int hashCode() {
    int result = Objects.hashCode(orderId);
    result = 31 * result + Objects.hashCode(restaurantId);
    result = 31 * result + Objects.hashCode(restaurantLocation);
    result = 31 * result + Objects.hashCode(customerLocation);
    return result;
  }
}
