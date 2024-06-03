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

import { Location, Order, OrderStatus, Status } from "../../order-app/types/types";
import { handlers, object, ObjectContext, ObjectSharedContext, TerminalError } from "@restatedev/restate-sdk";
import * as geo from "../utils/geo";
import { DeliveryInfo, DEMO_REGION } from "../types/types";
import { DriverDeliveryMatcher } from "../matcher/api";
import { DriverDigitalTwin } from "../driver/api";
import shared = handlers.object.shared;
import { OrderWorkflow } from "../../order-app/workflow/api";

const DELIVERY_ETA = "delivery_eta";
const DELIVERY_INFO = "delivery_info";

const DriverMatcher: DriverDeliveryMatcher = {
  name: "driver-delivery-matcher",
};
const DigitalTwinObject: DriverDigitalTwin = { name: "driver-digital-twin" };
const OrderWorkflowObject: OrderWorkflow = { name: "order-workflow" };

export default object({
  name: "delivery",
  handlers: {

    startDelivery: async (ctx: ObjectContext, order: Order) => {
      const deliveryInfo = await ctx.run(() => { return {
        restaurantLocation: geo.randomLocation(),
        customerLocation: geo.randomLocation(),
        isPickedUp: false,
      }});
      ctx.set(DELIVERY_INFO, deliveryInfo);

      // Acquire a driver
      const driverPromise = ctx.awakeable<string>();
      ctx.objectSendClient(DriverMatcher, DEMO_REGION)
        .requestDriverForDelivery({
          promiseId: driverPromise.id,
          deliveryInfo: deliveryInfo
        });

      // Wait until the driver pool service has located a driver
      // This awakeable gets resolved either immediately when there is a pending delivery
      // or later, when a new delivery comes in.
      const driverId = await driverPromise.promise;

      await ctx.objectClient(DigitalTwinObject, driverId).assignDeliveryJob({
        deliveryId: ctx.key,
        restaurantId: order.restaurantId,
        restaurantLocation: deliveryInfo.restaurantLocation,
        customerLocation: deliveryInfo.customerLocation,
      });
    },

    updateDeliveryLocation: async (ctx: ObjectContext, newLocation: Location) => {
      const delivery = await ctx.get<DeliveryInfo>(DELIVERY_INFO);

      if(!delivery) {
        throw new TerminalError("Driver is doing a delivery but there is no ongoing delivery");
      }

      const eta = delivery.isPickedUp
        ? geo.calculateEtaMillis(newLocation, delivery.customerLocation)
        : geo.calculateEtaMillis(newLocation, delivery.restaurantLocation) +
        geo.calculateEtaMillis(
          delivery.restaurantLocation,
          delivery.customerLocation
        );

      ctx.set(DELIVERY_ETA, eta);
    },

    notifyDeliveryPickup: async (ctx: ObjectContext) => {
      const delivery = (await ctx.get<DeliveryInfo>(DELIVERY_INFO))!;
      delivery.isPickedUp = true;
      ctx.set(DELIVERY_INFO, delivery);

      ctx.workflowClient(OrderWorkflowObject, ctx.key)
        .notifyOrderPickedUp();
    },

    // Called by the DriverService.NotifyDeliveryDelivered when the driver has delivered the order to the customer.
    notifyDeliveryDelivered: async (ctx: ObjectContext) => {
      ctx.clear(DELIVERY_INFO);

      ctx.workflowClient(OrderWorkflowObject, ctx.key)
        .notifyDeliveryDelivered();
    },

    /** Gets called by the webUI frontend to display the status of an order. */
    getETA: shared(async (ctx: ObjectSharedContext) => await ctx.get<OrderStatus>(DELIVERY_ETA) ?? -1),

  },
});

