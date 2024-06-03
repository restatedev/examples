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
import { Order, Status } from "../types/types";
import { getPaymentClient } from "../clients/payment_client";
import { getRestaurantClient } from "../clients/restaurant_client";
import { Delivery } from "../../delivery-app/delivery/api";

/**
 * Order processing workflow Gets called for each Kafka event that is published to the order topic.
 * The event contains the order ID and the raw JSON order. The workflow handles the payment, asks
 * the restaurant to start the preparation, and triggers the delivery.
 */

const restaurant = getRestaurantClient();
const paymentClient = getPaymentClient();
const Delivery: Delivery = { name: "delivery" };

export default restate.workflow({
  name: "order-workflow",
  handlers: {

    run: async (ctx: restate.WorkflowContext, order: Order) => {
      const { id, totalCost, deliveryDelay } = order;

      // 1. Set status
      ctx.set("status", Status.CREATED);

      // 2. Handle payment
      const token = ctx.rand.uuidv4();
      const paid = await ctx.run("payment", () => paymentClient.charge(id, token, totalCost));

      if (!paid) {
        ctx.set("status", Status.REJECTED);
        return;
      }

      // 3. Schedule preparation
      ctx.set("status", Status.SCHEDULED);
      await ctx.sleep(deliveryDelay);

      // 4. Trigger preparation
      const preparationPromise = ctx.awakeable();
      await ctx.run(() => restaurant.prepare(id, preparationPromise.id));
      ctx.set("status", Status.IN_PREPARATION);

      await preparationPromise.promise;
      ctx.set("status", Status.SCHEDULING_DELIVERY);

      // 5. Start the delivery, this returns when a driver is found
      await ctx.objectClient(Delivery, ctx.key).startDelivery(order);
      ctx.set("status", Status.WAITING_FOR_DRIVER);
      await ctx.promise("order_picked_up");
      ctx.set("status", Status.IN_DELIVERY);

      // 6. Wait for the delivery to be completed
      await ctx.promise("delivery");
      ctx.set("status", Status.DELIVERED);
    },

    getStatus: async (ctx: restate.WorkflowSharedContext) => {
      return await ctx.get("status") ?? Status.UNKNOWN;
    },

    notifyOrderPickedUp: async (ctx: restate.WorkflowSharedContext) => {
      ctx.promise("order_picked_up").resolve();
    },

    notifyDeliveryDelivered: async (ctx: restate.WorkflowSharedContext) => {
      ctx.promise("delivery").resolve();
    },
  }
});