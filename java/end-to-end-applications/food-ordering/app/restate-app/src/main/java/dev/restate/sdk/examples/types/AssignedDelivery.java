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

package dev.restate.sdk.examples.types;

public class AssignedDelivery {

  private final String driverId;
  private final String orderId;
  private final String restaurantId;
  private final Location restaurantLocation;
  private final Location customerLocation;
  private boolean orderPickedUp = false;

  public AssignedDelivery(
      String driverId,
      String orderId,
      String restaurantId,
      Location restaurantLocation,
      Location customerLocation) {
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
