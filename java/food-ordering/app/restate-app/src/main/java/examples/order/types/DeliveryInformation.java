/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

package examples.order.types;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class DeliveryInformation {
  private final String restaurantId;
  private final Location restaurantLocation;
  private final Location customerLocation;
  private boolean orderPickedUp;

  @JsonCreator
  public DeliveryInformation(
      @JsonProperty("restaurantId") String restaurantId,
      @JsonProperty("restaurantLocation") Location restaurantLocation,
      @JsonProperty("customerLocation") Location customerLocation,
      @JsonProperty("orderPickedUp") boolean orderPickedUp) {
    this.restaurantId = restaurantId;
    this.restaurantLocation = restaurantLocation;
    this.customerLocation = customerLocation;
    this.orderPickedUp = orderPickedUp;
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
    this.orderPickedUp = true;
  }
}
