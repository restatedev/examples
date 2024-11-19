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

import {object, ObjectContext} from "@restatedev/restate-sdk";
import type { DriverDigitalTwin } from "../driver_digital_twin/api";
import type { DriverDeliveryMatcher } from "../driver_delivery_matcher/api";
import * as geo from "../utils/geo";
import {DEMO_REGION, Location, DeliveryInformation, Order} from "../types/types";
import type {OrderStatus} from "../../order-app/order_status/api";
import { OrderWorkflow } from "../../order-app/order_workflow/api";

/**
 * Manages the delivery of the order to the customer. Object by the order ID (similar to the
 * OrderService and OrderStatusService).
 */
const OrderWorkflowObject: OrderWorkflow = { name: "order-workflow"};
const OrderStatusObject: OrderStatus = { name: "order-status" };
const DigitalTwinObject: DriverDigitalTwin = { name: "driver-digital-twin" };
const DriverMatcher: DriverDeliveryMatcher = {
  name: "driver-delivery-matcher",
};

const DELIVERY_INFO = "delivery-info";

export default object({
  name: "delivery-manager",
  handlers: {
    // Called by the OrderService when a new order has been prepared and needs to be delivered.
    start: async (
      ctx: ObjectContext,
      order: Order
    ) => {
      const [restaurantLocation, customerLocation] = await ctx.run(() => [
        geo.randomLocation(),
        geo.randomLocation(),
      ]);

      // Store the delivery information in Restate's state store
      const deliveryInfo: DeliveryInformation = {
        orderId: order.id,
        restaurantId: order.restaurantId,
        restaurantLocation,
        customerLocation,
        orderPickedUp: false,
      };
      ctx.set(DELIVERY_INFO, deliveryInfo);

      // Acquire a driver
      const driverPromise = ctx.awakeable<string>();
      ctx
        .objectSendClient(DriverMatcher, DEMO_REGION)
        .requestDriverForDelivery({ promiseId: driverPromise.id });
      // Wait until the driver pool service has located a driver
      // This awakeable gets resolved either immediately when there is a pending delivery
      // or later, when a new delivery comes in.
      const driverId = await driverPromise.promise;

      // Assign the driver to the job
      await ctx.objectClient(DigitalTwinObject, driverId).assignDeliveryJob({
        deliveryId: ctx.key,
        restaurantId: order.restaurantId,
        restaurantLocation: deliveryInfo.restaurantLocation,
        customerLocation: deliveryInfo.customerLocation,
      });
    
        await ctx
          .workflowClient(OrderWorkflowObject, order.id)
          .selectedDriver();
    },

    // called by the DriverService.NotifyDeliveryPickup when the driver has arrived at the restaurant.
    notifyDeliveryPickup: async (ctx: ObjectContext) => {
      const delivery = (await ctx.get<DeliveryInformation>(DELIVERY_INFO))!;
      delivery.orderPickedUp = true;
      ctx.set(DELIVERY_INFO, delivery);

      await ctx
        .workflowClient(OrderWorkflowObject, delivery.orderId)
        .signalDriverAtRestaurant();
    },

    // Called by the DriverService.NotifyDeliveryDelivered when the driver has delivered the order to the customer.
    notifyDeliveryDelivered: async (ctx: ObjectContext) => {
      const delivery = (await ctx.get<DeliveryInformation>(DELIVERY_INFO))!;
      ctx.clear(DELIVERY_INFO);

      // Notify the OrderService that the delivery has been completed
      await ctx
          .workflowClient(OrderWorkflowObject, delivery.orderId)
          .signalDeliveryFinished()
    },

    // Called by DriverDigitalTwin.HandleDriverLocationUpdateEvent() when the driver moved to new location.
    handleDriverLocationUpdate: async (
      ctx: ObjectContext,
      location: Location
    ) => {
      const delivery = (await ctx.get<DeliveryInformation>(DELIVERY_INFO))!;

      // Parse the new location, and calculate the ETA of the delivery to the customer
      const eta = delivery.orderPickedUp
        ? geo.calculateEtaMillis(location, delivery.customerLocation)
        : geo.calculateEtaMillis(location, delivery.restaurantLocation) +
          geo.calculateEtaMillis(
            delivery.restaurantLocation,
            delivery.customerLocation
          );

      ctx.objectSendClient(OrderStatusObject, delivery.orderId).setETA(eta);
    },
  },
});
