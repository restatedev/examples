import * as restate from "@restatedev/restate-sdk";
import * as deliveryManager from "../delivery-app/delivery_manager";
import {Order, Status} from "./types/types";
import * as orderstatus from "./order_status_service";
import {getPaymentClient} from "./clients/payment_client";
import {getRestaurantClient} from "./clients/restaurant_client";
import {fail} from "./utils/utils";

export const service: restate.ServiceApi<typeof router> = { path: "order-workflow" };

const restaurant = getRestaurantClient();
const paymentClnt = getPaymentClient();

export const router = restate.keyedRouter({
  create: async ( ctx: restate.RpcContext, orderId: string, order: Order) => {
    const { id, totalCost, deliveryDelay } = order;

    // 1. Set status
    ctx.send(orderstatus.service).setStatus(id, Status.CREATED);

    // 2. Handle payment
    const token = ctx.rand.uuidv4();
    // console.info(token);
    const paid = await ctx.sideEffect(async () => paymentClnt.charge(id, token, totalCost));

    if (!paid) {
      ctx.send(orderstatus.service).setStatus(id, Status.REJECTED);
      return;
    }

    // 3. Wait for desired preparation time
    ctx.send(orderstatus.service).setStatus(id, Status.SCHEDULED);
    await ctx.sleep(deliveryDelay);

    // 4. Trigger preparation
    const preparationPromise = ctx.awakeable();
    await ctx.sideEffect(() => restaurant.prepare(id, preparationPromise.id));
    ctx.send(orderstatus.service).setStatus(id, Status.IN_PREPARATION);

    await preparationPromise.promise;
    ctx.send(orderstatus.service).setStatus(id, Status.SCHEDULING_DELIVERY);

    // fail(orderId, "Failed");
    // 5. Find a driver and start delivery
    await deliver(ctx, order);
    ctx.send(orderstatus.service).setStatus(id, Status.DELIVERED);
    //
  }
});

async function deliver(ctx: restate.RpcContext, order: Order) {
  const deliveryId = ctx.rand.uuidv4();
  const deliveryPromise = ctx.awakeable<void>();
  await ctx.rpc(deliveryManager.service).start(deliveryId, {order, promise: deliveryPromise.id})
  await deliveryPromise.promise;
}
