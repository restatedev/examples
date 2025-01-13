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

import { object, ObjectContext, TerminalError } from "@restatedev/restate-sdk";
import { DeliveryRequest, DriverStatus, Location } from "../types/types";

import type { DriverDeliveryMatcher } from "../driver_delivery_matcher/api";
import type { DeliveryManager } from "../delivery_manager/api";

/**
 * Digital twin for the driver. Represents a driver and his status, assigned delivery, and location.
 * Keyed by driver ID. The actual driver would have an application (mocked by Driver Mobile App Simulator) that
 * calls this service.
 */

export default object({
  name: "driver-digital-twin",
  handlers: {
    // Called by driver's mobile app at start of workday or end of delivery
    setDriverAvailable: async (ctx: ObjectContext, region: string) => {
      await checkIfDriverInExpectedState(DriverStatus.IDLE, ctx);

      ctx.set(DRIVER_STATUS, DriverStatus.WAITING_FOR_WORK);
      ctx
        .objectSendClient(DriverDeliveryMatcherObject, region)
        .setDriverAvailable(ctx.key);
    },

    // Gets polled by the driver's mobile app at regular intervals to check for assignments.
    getAssignedDelivery: async (ctx: ObjectContext) =>
      ctx.get<DeliveryRequest>(ASSIGNED_DELIVERY),

    // Gets called by the delivery manager when this driver was assigned to do the delivery.
    assignDeliveryJob: async (
      ctx: ObjectContext,
      deliveryRequest: DeliveryRequest
    ) => {
      await checkIfDriverInExpectedState(DriverStatus.WAITING_FOR_WORK, ctx);

      ctx.set(DRIVER_STATUS, DriverStatus.DELIVERING);
      ctx.set(ASSIGNED_DELIVERY, deliveryRequest);

      const currentLocation = await ctx.get<Location>(DRIVER_LOCATION);
      if (currentLocation) {
        ctx
          .objectSendClient(DeliveryManagerObject, deliveryRequest.deliveryId)
          .handleDriverLocationUpdate(currentLocation);
      }
    },

    // Called by driver's mobile app at pickup from the restaurant.
    notifyDeliveryPickUp: async (ctx: ObjectContext) => {
      await checkIfDriverInExpectedState(DriverStatus.DELIVERING, ctx);
      const assignedDelivery = (await ctx.get<DeliveryRequest>(
        ASSIGNED_DELIVERY
      ))!;

      ctx
        .objectSendClient(DeliveryManagerObject, assignedDelivery.deliveryId)
        .notifyDeliveryPickup();
    },

    // Called by driver's mobile app after delivery success.
    notifyDeliveryDelivered: async (ctx: ObjectContext) => {
      await checkIfDriverInExpectedState(DriverStatus.DELIVERING, ctx);

      const assignedDelivery = (await ctx.get<DeliveryRequest>(
        ASSIGNED_DELIVERY
      ))!;
      ctx.clear(ASSIGNED_DELIVERY);

      ctx
        .objectSendClient(DeliveryManagerObject, assignedDelivery.deliveryId)
        .notifyDeliveryDelivered();

      ctx.set(DRIVER_STATUS, DriverStatus.IDLE);
    },

    // Called by the driver's mobile app when he has moved to a new location.
    handleDriverLocationUpdateEvent: async (
      ctx: ObjectContext,
      location: Location
    ) => {
      ctx.set(DRIVER_LOCATION, location);
      const assignedDelivery = await ctx.get<DeliveryRequest>(
        ASSIGNED_DELIVERY
      );
      if (assignedDelivery) {
        ctx
          .objectSendClient(DeliveryManagerObject, assignedDelivery.deliveryId)
          .handleDriverLocationUpdate(location);
      }
    },
  },
});


async function checkIfDriverInExpectedState(expectedStatus: DriverStatus, ctx: ObjectContext): Promise<void> {
  const currentStatus = (await ctx.get<DriverStatus>(DRIVER_STATUS)) ?? DriverStatus.IDLE;

  if (currentStatus !== expectedStatus) {
    throw new TerminalError(`Driver status wrong. Expected ${expectedStatus} but was ${currentStatus}`);
  }
}

const DRIVER_STATUS = "driver-status";
const ASSIGNED_DELIVERY = "assigned-delivery";
const DRIVER_LOCATION = "driver-location";
const DriverDeliveryMatcherObject: DriverDeliveryMatcher = {
  name: "driver-delivery-matcher",
};
const DeliveryManagerObject: DeliveryManager = { name: "delivery-manager" };

