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
import type { DeliveryManager } from "../delivery-app/delivery_manager/api";
import { Order, Status } from "./types/types";

import type { OrderStatus } from "./status/api";
import { getPaymentClient } from "./clients/payment_client";
import { getRestaurantClient } from "./clients/restaurant_client";

/**
 * Order processing workflow Gets called for each Kafka event that is published to the order topic.
 * The event contains the order ID and the raw JSON order. The workflow handles the payment, asks
 * the restaurant to start the preparation, and triggers the delivery.
 */

const restaurant = getRestaurantClient();
const paymentClient = getPaymentClient();
const OrderStatusObject: OrderStatus = { name: "order-status" };
const DeliveryManagerObject: DeliveryManager = { name: "delivery-manager" };

export default restate.object({
  name: "order-workflow",
  handlers: {

    create: async (ctx: restate.ObjectContext, order: Order) => {
      const { id, totalCost, deliveryDelay } = order;

      const status = ctx.objectSendClient(OrderStatusObject, id);

      // 1. Set status
      status.setStatus(Status.CREATED);

      // 2. Handle payment
      const token = ctx.rand.uuidv4();
      const paid = await ctx.run("payment", () => paymentClient.charge(id, token, totalCost));

      if (!paid) {
        status.setStatus(Status.REJECTED);
        return;
      }

      // 3. Schedule preparation
      status.setStatus(Status.SCHEDULED);
      await ctx.sleep(deliveryDelay);

      // 4. Trigger preparation
      const preparationPromise = ctx.awakeable();
      await ctx.run(() => restaurant.prepare(id, preparationPromise.id));
      status.setStatus(Status.IN_PREPARATION);

      await preparationPromise.promise;
      status.setStatus(Status.SCHEDULING_DELIVERY);

      // 5. Find a driver and start delivery
      await deliver(ctx, order);
      status.setStatus(Status.DELIVERED);
    }
  }
});

async function deliver(ctx: restate.Context, order: Order) {
  const deliveryId = ctx.rand.uuidv4();
  const deliveryPromise = ctx.awakeable<void>();
  await ctx.objectClient(DeliveryManagerObject, deliveryId).start({ order, promise: deliveryPromise.id })
  await deliveryPromise.promise;
}
