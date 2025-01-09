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
import {WorkflowSharedContext} from "@restatedev/restate-sdk";
import type {DeliveryManager} from "../delivery_manager/api";
import {Order, Status} from "../types/types";
import {getPaymentClient} from "../clients/payment_client";
import {getRestaurantClient} from "../clients/restaurant_client";

/**
 * Order processing workflow Gets called for each Kafka event that is published to the order topic.
 * The event contains the order ID and the raw JSON order. The workflow handles the payment, asks
 * the restaurant to start the preparation, and triggers the delivery.
 */

const restaurant = getRestaurantClient();
const paymentClient = getPaymentClient();
const DeliveryManagerObject: DeliveryManager = { name: "delivery-manager" };

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
      await ctx.run(() => restaurant.prepare(id));
      ctx.set("status", Status.IN_PREPARATION);

      await ctx.promise("preparation_finished");
      ctx.set("status", Status.SCHEDULING_DELIVERY);

      // 5. Find a driver and start delivery
      const deliveryId = ctx.rand.uuidv4();
      ctx.objectSendClient(DeliveryManagerObject, deliveryId).start(order)

      await ctx.promise("driver_selected");
      ctx.set("status", Status.WAITING_FOR_DRIVER);
      await ctx.promise("driver_at_restaurant");
      ctx.set("status", Status.IN_DELIVERY);
      await ctx.promise("delivery_finished");
      ctx.set("status", Status.DELIVERED);
    },


    finishedPreparation: async (ctx: WorkflowSharedContext)=> {
      ctx.promise("preparation_finished").resolve();
    },

    selectedDriver: async (ctx: WorkflowSharedContext)=> {
      ctx.promise("driver_selected").resolve();
    },

    signalDriverAtRestaurant: async (ctx: WorkflowSharedContext)=> {
      ctx.promise("driver_at_restaurant").resolve();
    },

    signalDeliveryFinished: async (ctx: WorkflowSharedContext)=> {
      ctx.promise("delivery_finished").resolve();
    },

    getStatus: async (ctx: WorkflowSharedContext)=> {
      return ctx.get<Status>("status");
    }
  }
});

