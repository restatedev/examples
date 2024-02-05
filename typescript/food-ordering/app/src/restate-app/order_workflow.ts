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
import * as deliveryManager from "./delivery_manager";
import {Order, Status} from "./types/types";
import * as orderstatus from "./order_status_service";
import { completed } from "./utils/utils";
import {getPaymentClient} from "./clients/payment_client";
import {getRestaurantClient} from "./clients/restaurant_client";

/**
 * Order processing workflow Gets called for each Kafka event that is published to the order topic.
 * The event contains the order ID and the raw JSON order. The workflow handles the payment, asks
 * the restaurant to start the preparation, and triggers the delivery.
 */

const restaurant = getRestaurantClient();
const paymentClnt = getPaymentClient();

const eventHandler = async (ctx: restate.RpcContext, event: restate.Event) => {
  const order = JSON.parse(event.json<string>());
  await create(ctx, event.key, order);
};

const create = async (
  ctx: restate.RpcContext,
  orderId: string,
  order: Order
) => {
  // Ignore already completed orders
  if (await completed(ctx)) {
    return
  }

  const { id, totalCost, deliveryDelay } = order;

  // 1. Set status
  ctx.send(orderstatus.service).setStatus(id, Status.CREATED);

  // 2. Handle payment
  const token = ctx.rand.uuidv4();
  const paid = await ctx.sideEffect(() => paymentClnt.charge(id, token, totalCost));

  if (!paid) {
    ctx.send(orderstatus.service).setStatus(id, Status.REJECTED);
    return;
  }

  // 3. Schedule preparation
  ctx.send(orderstatus.service).setStatus(id, Status.SCHEDULED);
  await ctx.sleep(deliveryDelay);

  // 4. Trigger preparation
  const preparationPromise = ctx.awakeable();
  await ctx.sideEffect(() => restaurant.prepare(id, preparationPromise.id));
  ctx.send(orderstatus.service).setStatus(id, Status.IN_PREPARATION);

  await preparationPromise.promise;
  ctx.send(orderstatus.service).setStatus(id, Status.SCHEDULING_DELIVERY);

  // 5. Find a driver and start delivery
  const deliveryId = ctx.rand.uuidv4();
  const deliveryPromise = ctx.awakeable<void>();
  await ctx.rpc(deliveryManager.service).start(deliveryId, {order, promise: deliveryPromise.id})
  await deliveryPromise.promise;
  ctx.send(orderstatus.service).setStatus(id, Status.DELIVERED);
};

export const router = restate.keyedRouter({
  create,
  eventHandler: restate.keyedEventHandler(eventHandler),
});

export type orderApi = typeof router;
export const service: restate.ServiceApi<orderApi> = { path: "order-workflow" };