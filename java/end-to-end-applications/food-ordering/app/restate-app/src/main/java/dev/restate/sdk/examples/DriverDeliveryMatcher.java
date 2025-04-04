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

package dev.restate.sdk.examples;

import com.fasterxml.jackson.core.type.TypeReference;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.types.StateKey;
import dev.restate.sdk.types.TerminalException;
import dev.restate.serde.TypeRef;

import java.util.LinkedList;
import java.util.Queue;

/**
 * Links available drivers to delivery requests Keyed by the region. Each region has a pool of
 * available drivers and orders waiting for a driver. This service is responsible for tracking and
 * matching the two.
 */
@VirtualObject
public class DriverDeliveryMatcher {

  // Deliveries that are waiting for a driver to become available
  private static final StateKey<Queue<String>> PENDING_DELIVERIES =
      StateKey.of("pending-deliveries", new TypeRef<>() {});

  // Drivers that are waiting for new delivery requests
  private static final StateKey<Queue<String>> AVAILABLE_DRIVERS =
      StateKey.of("available-drivers", new TypeRef<>() {});

  /**
   * Gets called when a new driver becomes available. Links the driver to the next delivery waiting
   * in line. If no pending deliveries, driver is added to the available driver pool
   */
  @Handler
  public void setDriverAvailable(ObjectContext ctx, String driverId) throws TerminalException {
    var pendingDeliveries = ctx.get(PENDING_DELIVERIES).orElse(new LinkedList<>());

    // If there is a pending delivery, assign it to the driver
    var nextDelivery = pendingDeliveries.poll();
    if (nextDelivery != null) {
      // Update the queue in state. Delivery was removed.
      ctx.set(PENDING_DELIVERIES, pendingDeliveries);
      // Notify that delivery is ongoing
      ctx.awakeableHandle(nextDelivery).resolve(String.class, driverId);
      return;
    }

    // Otherwise remember driver as available
    var availableDrivers = ctx.get(AVAILABLE_DRIVERS).orElse(new LinkedList<>());
    availableDrivers.offer(driverId);
    ctx.set(AVAILABLE_DRIVERS, availableDrivers);
  }

  /**
   * Gets called when a new delivery gets scheduled. Links the delivery to the next driver
   * available. If no available drivers, the delivery is added to the pending deliveries queue
   */
  @Handler
  public void requestDriverForDelivery(ObjectContext ctx, String deliveryCallbackId)
      throws TerminalException {
    var availableDrivers = ctx.get(AVAILABLE_DRIVERS).orElse(new LinkedList<>());

    // If a driver is available, assign the delivery right away
    var nextAvailableDriver = availableDrivers.poll();
    if (nextAvailableDriver != null) {
      // Remove driver from the pool
      ctx.set(AVAILABLE_DRIVERS, availableDrivers);
      // Notify that delivery is ongoing
      ctx.awakeableHandle(deliveryCallbackId).resolve(String.class, nextAvailableDriver);
      return;
    }

    // otherwise store the delivery request until a new driver becomes available
    var pendingDeliveries = ctx.get(PENDING_DELIVERIES).orElse(new LinkedList<>());
    pendingDeliveries.offer(deliveryCallbackId);
    ctx.set(PENDING_DELIVERIES, pendingDeliveries);
  }
}
