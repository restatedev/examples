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

import * as restate from "@restatedev/restate-sdk";
import * as driverDeliveryMatcher from "./driver_delivery_matcher";
import * as deliveryManager from "./delivery_manager";
import {DeliveryRequest, DriverStatus, Location} from "./types/types";

/**
 * Digital twin for the driver. Represents a driver and his status, assigned delivery, and location.
 * Keyed by driver ID. The actual driver would have an application (mocked by Driver Mobile App Simulator) that
 * calls this service.
 */
export const service: restate.ServiceApi<typeof router> = {path: "driver-digital-twin"};

const DRIVER_STATUS = "driver-status";
const ASSIGNED_DELIVERY = "assigned-delivery";
const DRIVER_LOCATION = "driver-location";

export const router = restate.keyedRouter({
    // Called by driver's mobile app at start of workday or end of delivery
    setDriverAvailable: async (ctx: restate.RpcContext, driverId: string, region: string) => {
        await checkIfDriverInExpectedState(DriverStatus.IDLE, ctx);

        ctx.set(DRIVER_STATUS, DriverStatus.WAITING_FOR_WORK);
        ctx.send(driverDeliveryMatcher.service).setDriverAvailable(region, driverId);
    },

    // Gets polled by the driver's mobile app at regular intervals to check for assignments.
    getAssignedDelivery: async (ctx: restate.RpcContext) => ctx.get<DeliveryRequest>(ASSIGNED_DELIVERY),

    // Gets called by the delivery manager when this driver was assigned to do the delivery.
    assignDeliveryJob: async (ctx: restate.RpcContext, _driverId: string, deliveryRequest: DeliveryRequest) => {
        await checkIfDriverInExpectedState(DriverStatus.WAITING_FOR_WORK, ctx);

        ctx.set(DRIVER_STATUS, DriverStatus.DELIVERING);
        ctx.set(ASSIGNED_DELIVERY, deliveryRequest);

        const currentLocation = await ctx.get<Location>(DRIVER_LOCATION);
        if (currentLocation) {
            ctx.send(deliveryManager.service).handleDriverLocationUpdate(deliveryRequest.deliveryId, currentLocation);
        }
    },

    // Called by driver's mobile app at pickup from the restaurant.
    notifyDeliveryPickUp: async (ctx: restate.RpcContext, _driverId: string) => {
        await checkIfDriverInExpectedState(DriverStatus.DELIVERING, ctx);
        const assignedDelivery = (await ctx.get<DeliveryRequest>(ASSIGNED_DELIVERY))!;
        ctx.send(deliveryManager.service).notifyDeliveryPickup(assignedDelivery.deliveryId);
    },

    // Called by driver's mobile app after delivery success.
    notifyDeliveryDelivered: async (ctx: restate.RpcContext, _driverId: string) => {
        await checkIfDriverInExpectedState(DriverStatus.DELIVERING, ctx);

        const assignedDelivery = (await ctx.get<DeliveryRequest>(ASSIGNED_DELIVERY))!;
        ctx.clear(ASSIGNED_DELIVERY);
        ctx.send(deliveryManager.service).notifyDeliveryDelivered(assignedDelivery.deliveryId);
        ctx.set(DRIVER_STATUS, DriverStatus.IDLE);
    },

    // Called by the driver's mobile app when he has moved to a new location.
    handleDriverLocationUpdateEvent: restate.keyedEventHandler(async (ctx: restate.RpcContext, event: restate.Event) => {
        const location = event.json<Location>();
        ctx.set(DRIVER_LOCATION, location);
        const assignedDelivery = await ctx.get<DeliveryRequest>(ASSIGNED_DELIVERY);
        if (assignedDelivery) {
            ctx.send(deliveryManager.service).handleDriverLocationUpdate(assignedDelivery.deliveryId, location);
        }
    })
})


async function checkIfDriverInExpectedState(expectedStatus: DriverStatus, ctx: restate.RpcContext): Promise<void> {
  const currentStatus = (await ctx.get<DriverStatus>(DRIVER_STATUS)) ?? DriverStatus.IDLE;

  if (currentStatus !== expectedStatus) {
    throw new restate.TerminalError(`Driver status wrong. Expected ${expectedStatus} but was ${currentStatus}`);
  }
}