/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import { object, ObjectContext, rpc } from "@restatedev/restate-sdk";
import * as geo from "../utils/geo";
import {DEMO_REGION, Location, DeliveryState} from "../types/types";
import { getPublisher } from "../clients/kafka_publisher";
import {updateLocation} from "./driver_mobile_app_sim_utils";
import type {DriverDigitalTwin } from "../driver_digital_twin/api";

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

const POLL_INTERVAL = { seconds: 1 };
const MOVE_INTERVAL = { seconds: 1 };
const PAUSE_BETWEEN_DELIVERIES = { seconds: 2 };


const TwinObject: DriverDigitalTwin = {name : "driver-digital-twin"};

const mobileAppObject =  object({
  name : "driver-mobile-app",
  handlers: {

    startDriver: async (ctx: ObjectContext) => {
    // check if we exist already
    if (await ctx.get<Location>(CURRENT_LOCATION) !== null) {
      return;
    }

    console.log(`Driver ${ctx.key} starting up`);

    const location = await ctx.run(() => geo.randomLocation());
    ctx.set(CURRENT_LOCATION, location);
    await ctx.run(() =>kafkaPublisher.send(ctx.key, location));

    ctx.objectSendClient(TwinObject, ctx.key).setDriverAvailable(DEMO_REGION);
    ctx.objectSendClient(Self, ctx.key).pollForWork();
  },

  pollForWork: async (ctx: ObjectContext) => {
    const optionalAssignedDelivery = await ctx.objectClient(TwinObject, ctx.key).getAssignedDelivery();
    if (optionalAssignedDelivery === null || optionalAssignedDelivery === undefined) {
      ctx.objectSendClient(Self, ctx.key).pollForWork(rpc.sendOpts({ delay: POLL_INTERVAL }));
      return;
    }

    const delivery: DeliveryState = {
      currentDelivery: optionalAssignedDelivery,
      orderPickedUp: false
    }
    ctx.set(ASSIGNED_DELIVERY, delivery);

    ctx.objectSendClient(Self, ctx.key).move(rpc.sendOpts({delay: MOVE_INTERVAL}));
  },

  move: async (ctx: ObjectContext) => {
    const currentLocation = (await ctx.get<Location>(CURRENT_LOCATION))!;
    const assignedDelivery = (await ctx.get<DeliveryState>(ASSIGNED_DELIVERY))!;

    const nextTarget = assignedDelivery.orderPickedUp
        ? assignedDelivery.currentDelivery.customerLocation
        : assignedDelivery.currentDelivery.restaurantLocation;

    const { newLocation, arrived } = updateLocation(currentLocation, nextTarget);

    ctx.set(CURRENT_LOCATION, newLocation);
    await ctx.run(() => kafkaPublisher.send(ctx.key, currentLocation));

    if (arrived) {
      if (assignedDelivery.orderPickedUp) {
        // fully done
        ctx.clear(ASSIGNED_DELIVERY);

        await ctx.objectClient(TwinObject, ctx.key).notifyDeliveryDelivered();
        await ctx.sleep(PAUSE_BETWEEN_DELIVERIES);

        ctx.objectSendClient(TwinObject, ctx.key).setDriverAvailable(DEMO_REGION);
        ctx.objectSendClient(Self, ctx.key).pollForWork();
        return;
      }

      assignedDelivery.orderPickedUp = true;
      ctx.set(ASSIGNED_DELIVERY, assignedDelivery);

      await ctx.objectClient(TwinObject, ctx.key).notifyDeliveryPickUp();
    }

    ctx.objectSendClient(Self, ctx.key).move(rpc.sendOpts({delay: MOVE_INTERVAL}));
  }
}})

const Self: typeof mobileAppObject = { name : "driver-mobile-app" };

export default mobileAppObject;