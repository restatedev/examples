import * as restate from "@restatedev/restate-sdk";
import * as delivery from "./delivery";
import { v4 as uuidv4 } from "uuid";
import {Order, Status} from "../types/types";
import * as orderstatus from "./order_status_service";
import { getStripeClient } from "../clients/stripe_client";
import { completed } from "../utils/utils";
import * as restaurantProxy from "./restaurant_proxy";

const stripe = getStripeClient();

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
  const token = await ctx.sideEffect(async () => uuidv4());
  const paid = await ctx.sideEffect(() => stripe.charge(id, token, totalCost));

  if (!paid) {
    ctx.send(orderstatus.service).setStatus(id, Status.REJECTED);
    return;
  }

  // 3. Schedule preparation
  ctx.send(orderstatus.service).setStatus(id, Status.SCHEDULED);
  await ctx.sleep(deliveryDelay);

  // 4. Trigger preparation
  const preparationPromise = ctx.awakeable();
  // The locally running POS server is not reachable by Lambda, so to simplify the setup the restaurant is also a Restate service.
  // If the POS server would be deployed somewhere, this would be a side effect that sends an HTTP request to the restaurant.
  ctx.send(restaurantProxy.service).prepare(id, preparationPromise.id);
  ctx.send(orderstatus.service).setStatus(id, Status.IN_PREPARATION);

  await preparationPromise.promise;
  ctx.send(orderstatus.service).setStatus(id, Status.SCHEDULING_DELIVERY);

  // 5. Find a driver and start delivery
  await delivery.createDelivery(ctx, order);
  ctx.send(orderstatus.service).setStatus(id, Status.DELIVERED);
};

export const router = restate.keyedRouter({
  create,
  eventHandler: restate.keyedEventHandler(eventHandler),
});

export type orderApi = typeof router;
export const service: restate.ServiceApi<orderApi> = { path: "orders" };