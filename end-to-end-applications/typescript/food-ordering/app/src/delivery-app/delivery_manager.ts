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
import * as driverDigitalTwin from "./driver_digital_twin";
import * as driverDeliveryMatcher from "./driver_delivery_matcher";
import * as geo from "./utils/geo";
import {DEMO_REGION, Location, DeliveryInformation, OrderAndPromise, Status} from "./types/types";
import * as orderstatus from "../order-app/order_status_service";

/**
 * Manages the delivery of the order to the customer. Keyed by the order ID (similar to the
 * OrderService and OrderStatusService).
 */
export const service: restate.ServiceApi<typeof router> = { path: "delivery-manager" };

const DELIVERY_INFO = "delivery-info";

export const router = restate.keyedRouter({
    // Called by the OrderService when a new order has been prepared and needs to be delivered.
    start: async (ctx: restate.KeyedContext, deliveryId: string, { order, promise }: OrderAndPromise) => {
        const [restaurantLocation, customerLocation] = await ctx.sideEffect(async () => [geo.randomLocation(), geo.randomLocation()]);

        // Store the delivery information in Restate's state store
        const deliveryInfo: DeliveryInformation = {
            orderId: order.id,
            orderPromise: promise,
            restaurantId: order.restaurantId,
            restaurantLocation,
            customerLocation,
            orderPickedUp: false
        }
        ctx.set(DELIVERY_INFO, deliveryInfo);

        // Acquire a driver
        const driverPromise = ctx.awakeable<string>();
        ctx.send(driverDeliveryMatcher.service).requestDriverForDelivery(DEMO_REGION, { promiseId: driverPromise.id });
        // Wait until the driver pool service has located a driver
        // This awakeable gets resolved either immediately when there is a pending delivery
        // or later, when a new delivery comes in.
        const driverId = await driverPromise.promise;

        // Assign the driver to the job
        await ctx.rpc(driverDigitalTwin.service).assignDeliveryJob(driverId, {
                deliveryId,
                restaurantId: order.restaurantId,
                restaurantLocation: deliveryInfo.restaurantLocation,
                customerLocation: deliveryInfo.customerLocation
            });

        ctx.send(orderstatus.service).setStatus(order.id, Status.WAITING_FOR_DRIVER);
    },

    // called by the DriverService.NotifyDeliveryPickup when the driver has arrived at the restaurant.
    notifyDeliveryPickup: async (ctx: restate.KeyedContext, _deliveryId: string) => {
        const delivery = (await ctx.get<DeliveryInformation>(DELIVERY_INFO))!;
        delivery.orderPickedUp = true;
        ctx.set(DELIVERY_INFO, delivery);

        ctx.send(orderstatus.service).setStatus(delivery.orderId, Status.IN_DELIVERY);
    },

    // Called by the DriverService.NotifyDeliveryDelivered when the driver has delivered the order to the customer.
    notifyDeliveryDelivered: async (ctx: restate.KeyedContext, _deliveryId: string) => {
        const delivery = (await ctx.get<DeliveryInformation>(DELIVERY_INFO))!;
        ctx.clear(DELIVERY_INFO);

        // Notify the OrderService that the delivery has been completed
        ctx.resolveAwakeable(delivery.orderPromise, null);
    },

    // Called by DriverDigitalTwin.HandleDriverLocationUpdateEvent() when the driver moved to new location.
    handleDriverLocationUpdate: async (ctx: restate.KeyedContext, _deliveryId: string, location: Location) => {
        const delivery = (await ctx.get<DeliveryInformation>(DELIVERY_INFO))!;

        // Parse the new location, and calculate the ETA of the delivery to the customer
        const eta = delivery.orderPickedUp
            ? geo.calculateEtaMillis(location, delivery.customerLocation)
            : geo.calculateEtaMillis(location, delivery.restaurantLocation)
            + geo.calculateEtaMillis(delivery.restaurantLocation, delivery.customerLocation);
        ctx.send(orderstatus.service).setETA(delivery.orderId, eta);
    },
});
