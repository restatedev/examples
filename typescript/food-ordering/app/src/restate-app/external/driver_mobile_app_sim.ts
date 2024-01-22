/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import * as driverDigitalTwin from "../driver_digital_twin";
import * as geo from "../utils/geo";
import {DEMO_REGION, Location, DeliveryState} from "../types/types";
import { getPublisher } from "../clients/kafka_publisher";
import {updateLocation} from "./driver_mobile_app_sim_utils";

/**
 * !!!SHOULD BE AN EXTERNAL APP ON THE DRIVER's PHONE!!! Simulated driver with application that
 * interacts with the food ordering app. This is not really part of the food ordering application.
 * This would actually be a mobile app that drivers use to accept delivery requests, and to set
 * themselves as available.
 *
 * For simplicity, we implemented this with Restate.
 */

const kafkaPublisher = getPublisher();

const ASSIGNED_DELIVERY = "assigned-delivery";
const CURRENT_LOCATION = "current-location";

const POLL_INTERVAL = 1000;
const MOVE_INTERVAL = 1000;
const PAUSE_BETWEEN_DELIVERIES = 2000;

/**
 * Mimics the driver setting himself to available in the app
 */
async function startDriver(ctx: restate.RpcContext, driverId: string) {
  // check if we exist already
  if (await ctx.get<Location>(CURRENT_LOCATION) !== null) {
    return;
  }

  console.log(`Driver ${driverId} starting up`);

  const location = await ctx.sideEffect(async () => geo.randomLocation());
  ctx.set(CURRENT_LOCATION, location);
  await kafkaPublisher.send(driverId, location);

  ctx.send(driverDigitalTwin.service).setDriverAvailable(driverId, DEMO_REGION);
  ctx.send(service).pollForWork(driverId);
}

/**
 * Asks the food ordering app to get a new delivery job. If there is no job, the driver will ask
 * again after a short delay.
 */
async function pollForWork(ctx: restate.RpcContext, driverId: string) {
  const optionalAssignedDelivery = await ctx.rpc(driverDigitalTwin.service).getAssignedDelivery(driverId);
  if (optionalAssignedDelivery === null || optionalAssignedDelivery === undefined) {
    ctx.sendDelayed(service, POLL_INTERVAL).pollForWork(driverId);
    return;
  }

  const delivery: DeliveryState = {
    currentDelivery: optionalAssignedDelivery,
    orderPickedUp: false
  }
  ctx.set(ASSIGNED_DELIVERY, delivery);
  ctx.sendDelayed(service, MOVE_INTERVAL).move(driverId);
}

/**
 * Periodically lets the food ordering app know the new location
 */
async function move(ctx: restate.RpcContext, driverId: string) {
  const currentLocation = (await ctx.get<Location>(CURRENT_LOCATION))!;
  const assignedDelivery = (await ctx.get<DeliveryState>(ASSIGNED_DELIVERY))!;

  const nextTarget = assignedDelivery.orderPickedUp
    ? assignedDelivery.currentDelivery.customerLocation
    : assignedDelivery.currentDelivery.restaurantLocation;

  const { newLocation, arrived } = updateLocation(currentLocation, nextTarget);

  ctx.set(CURRENT_LOCATION, newLocation);
  await kafkaPublisher.send(driverId, currentLocation);

  if (arrived) {
    if (assignedDelivery.orderPickedUp) {
      // fully done
      ctx.clear(ASSIGNED_DELIVERY);

      await ctx.rpc(driverDigitalTwin.service).notifyDeliveryDelivered(driverId);
      await ctx.sleep(PAUSE_BETWEEN_DELIVERIES);
      ctx.send(driverDigitalTwin.service).setDriverAvailable(driverId, DEMO_REGION);
      ctx.send(service).pollForWork(driverId);
      return;
    }

    assignedDelivery.orderPickedUp = true;
    ctx.set(ASSIGNED_DELIVERY, assignedDelivery);

    await ctx.rpc(driverDigitalTwin.service).notifyDeliveryPickUp(driverId);
  }

  ctx.sendDelayed(service, MOVE_INTERVAL).move(driverId);
}


export const router = restate.keyedRouter({
  startDriver,
  pollForWork,
  move
})

export const service: restate.ServiceApi<typeof router> = { path : "driver-mobile-app" };
