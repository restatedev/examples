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
import * as driver from "./driver";
import * as geo from "../utils/geo";
import { DEMO_REGION, DeliveryRequest, Location } from "../types/types";
import { getPublisher, DriverUpdatesPublisher } from "../clients/publisher";

const locationPingSender: DriverUpdatesPublisher = getPublisher();

type DeliveryState = {
  currentDelivery: DeliveryRequest,
  delivering: boolean
}

const DELIVERY_STATE = "driverstate";
const LOCATION_STATE = "location";

const pollInterval = 1000;
const moveInterval = 1000;
const pauseBetweenDeliveries = 2000;

async function startDriver(ctx: restate.RpcContext, driverId: string) {
  // check if we exist already
  if (await ctx.get<Location>(LOCATION_STATE) !== null) {
    return;
  }

  console.log(`Driver ${driverId} starting up`);

  const location = await ctx.sideEffect(async () => geo.randomLocation());
  ctx.set(LOCATION_STATE, location);
  await locationPingSender.send(ctx, driverId, location);

  startWork(ctx, driverId);
}

async function pollForWork(ctx: restate.RpcContext, driverId: string) {
  const work = await ctx.rpc(driver.service).pollAssignedDelivery(driverId);
  if (work === null || work === undefined) {
    ctx.sendDelayed(service, pollInterval).pollForWork(driverId);
    return;
  }

  const delivery: DeliveryState = {
    currentDelivery: work,
    delivering: false
  }
  ctx.set(DELIVERY_STATE, delivery);
  ctx.sendDelayed(service, moveInterval).move(driverId);
}

async function move(ctx: restate.RpcContext, driverId: string) {
  const location = (await ctx.get<Location>(LOCATION_STATE))!;
  const delivery = (await ctx.get<DeliveryState>(DELIVERY_STATE))!;

  const nextTarget = delivery.delivering
    ? delivery.currentDelivery.customerLocation
    : delivery.currentDelivery.restaurantLocation;

  const { newLocation, arrived } = updateLocation(location, nextTarget);

  ctx.set(LOCATION_STATE, newLocation);
  await locationPingSender.send(ctx, driverId, location);

  if (arrived) {
    if (delivery.delivering) {
      // fully done
      ctx.clear(DELIVERY_STATE);

      await ctx.rpc(driver.service).notifyDeliveryDelivered(driverId);
      await ctx.sleep(pauseBetweenDeliveries);
      startWork(ctx, driverId);
      return;
    }

    delivery.delivering = true;
    ctx.set(DELIVERY_STATE, delivery);

    await ctx.rpc(driver.service).notifyDeliveryPickUp(driverId);
  }

  ctx.sendDelayed(service, moveInterval).move(driverId);
}


export const router = restate.keyedRouter({
  startDriver,
  pollForWork,
  move
})

export const service: restate.ServiceApi<typeof router> = { path : "simulateddriver" };

// --------------------------------------------------------
//  helpers
// --------------------------------------------------------

function updateLocation(current: Location, target: Location): { newLocation: Location, arrived: boolean} {
  const newLong = dimStep(current.long, target.long);
  const newLat = dimStep(current.lat, target.lat);
  
  const arrived = newLong === target.long && newLat === target.lat;
  return { arrived, newLocation: { long: newLong, lat: newLat } }
}

function dimStep(current: number, target: number): number {
  const step = geo.step();
  return Math.abs(target - current) < step
    ? target
    : target > current
      ? current + step
      : current - step;
}

function startWork(ctx: restate.RpcContext, driverId: string) {
  ctx.send(driver.service).driverAvailable(driverId, DEMO_REGION);
  ctx.send(service).pollForWork(driverId);
}
