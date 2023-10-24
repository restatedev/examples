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
import { Order, OrderStatus } from "./types/types";
import { DeliveryProviderApiClient } from "./auxiliary/delivery_provider_api_client";
import axios from "axios";

const STATUS = "status";
const POS_ENDPOINT = process.env.POS_ENDPOINT || "http://localhost:5050";
const deliveryProviderApiClient = new DeliveryProviderApiClient();

const createOrder = async (
  ctx: restate.RpcContext,
  orderId: string,
  order: Order
) => {
  // Use sideEffects to call the external service so that the call can be replayed w/o
  // calling the external service again.
  const restaurantOpen = await ctx.sideEffect(
    async () =>
      (
        await axios.get(`${POS_ENDPOINT}/opening-hours/${order.restaurantId}`)
      ).data
  );

  if (restaurantOpen) {
    ctx.set(STATUS, OrderStatus.ACCEPTED);

    // Use sideEffects to call external service so that it can be replayed w/o
    // calling the external service again. Idempotency is provided by the orderId
    await ctx.sideEffect(async () => {
      await axios.post(`${POS_ENDPOINT}/create`, {
        orderId: orderId,
        order: order,
      });
    });

    // Schedule the prepare order request based on the desired delivery delay
    ctx.sendDelayed(orderApi, order.deliveryDelay).prepareOrder(orderId);

    return true;
  } else {
    ctx.set(STATUS, OrderStatus.REJECTED);
    return false;
  }
};

const prepareOrder = async (ctx: restate.RpcContext, orderId: string) => {
  const currentStatus = await ctx.get<OrderStatus>(STATUS);

  if (currentStatus === OrderStatus.ACCEPTED) {
    ctx.set(STATUS, OrderStatus.PROCESSING);

    // Create an awakeable (persistent promise) which can be resolved by an external system.
    // In order to resolve the promise, the external system needs the awakeable id.
    const orderPreparationAwakeable = ctx.awakeable();

    // Trigger the asynchronous order preparation whose completion will be awaited on.
    // The point of sales service will resolve the promise once the preparation is complete.
    // Idempotency is provided by the orderId.
    await ctx.sideEffect(async () => {
      await axios.post(`${POS_ENDPOINT}/prepare`, {
        awakeableId: orderPreparationAwakeable.id, // include so that POS is able to resolve the awakeable
        orderId: orderId,
      });
    });

    // Wait for the restaurant to notify us that the order is prepared.
    // This promise gets resolved when the point of sales service completes the
    // preparation and notifies Restate. Check the prepare handler in
    // @restatedev/example-food-ordering-pos-server for more details.
    await orderPreparationAwakeable.promise;

    ctx.set(STATUS, OrderStatus.PREPARED);

    // Tell the delivery provider to deliver the order. In order to make this call replayable
    // w/o calling the service again it is wrapped in a sideEffect. Idempotency is provided
    // by the orderId.
    await ctx.sideEffect(async () =>
      deliveryProviderApiClient.requestOrderDelivery(orderId)
    );
  }
};

const cancelOrder = async (ctx: restate.RpcContext, orderId: string) => {
  const currentStatus = await ctx.get<OrderStatus>(STATUS);

  // You can only cancel an order that is not yet being prepared or canceled
  if (currentStatus === OrderStatus.ACCEPTED) {
    ctx.set(STATUS, OrderStatus.CANCELED);

    // Notify the restaurant; cancel the order in their POS system. In order to make the call
    // replayable w/o calling the serivce again, it is wrapped in a sideEffect. Idempotency is
    // provided by the orderId.
    await ctx.sideEffect(async () => {
      await axios.post(`${POS_ENDPOINT}/cancel`, { orderId: orderId });
    });

    return true;
  } else {
    return false;
  }
};

const getOrderStatus = async (ctx: restate.RpcContext, _orderId: string) => {
  const status = (await ctx.get<OrderStatus>(STATUS)) ?? OrderStatus.UNKNOWN;
  return OrderStatus[status];
};

export const orderService = restate.keyedRouter({
  createOrder,
  prepareOrder,
  cancelOrder,
  getOrderStatus,
});

export const orderApi: restate.ServiceApi<typeof orderService> = {
  path: "OrderService",
};
