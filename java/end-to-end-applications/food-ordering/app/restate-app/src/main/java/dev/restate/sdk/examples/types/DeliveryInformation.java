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

public class DeliveryInformation {
  private final String orderId;
  private final String callbackId;
  private final String restaurantId;
  private final Location restaurantLocation;
  private final Location customerLocation;
  private boolean orderPickedUp;

  public DeliveryInformation(
      String orderId,
      String callbackId,
      String restaurantId,
      Location restaurantLocation,
      Location customerLocation,
      boolean orderPickedUp) {
    this.orderId = orderId;
    this.callbackId = callbackId;
    this.restaurantId = restaurantId;
    this.restaurantLocation = restaurantLocation;
    this.customerLocation = customerLocation;
    this.orderPickedUp = orderPickedUp;
  }

  public String getOrderId() {
    return orderId;
  }

  public String getCallbackId() {
    return callbackId;
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
