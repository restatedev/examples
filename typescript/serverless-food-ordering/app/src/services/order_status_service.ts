import { OrderStatus, Status } from "../types/types";
import * as restate from "@restatedev/restate-sdk";

const ORDER_STATUS = "order_status";

const get = async (ctx: restate.RpcContext, orderId: string) =>
  ctx.get<OrderStatus>(ORDER_STATUS);

const setStatus = async (
  ctx: restate.RpcContext,
  orderId: string,
  status: Status
) => {
  console.info(`[${orderId}] Order is ${status}`);
  const currentStatus = await ctx.get<OrderStatus>(ORDER_STATUS);
  ctx.set(ORDER_STATUS, { ...currentStatus, ...{ status } });
};

const setETA = async (
  ctx: restate.RpcContext,
  orderId: string,
  eta: number
) => {
  const currentStatus = await ctx.get<OrderStatus>(ORDER_STATUS);
  ctx.set(ORDER_STATUS, {
    eta: eta,
    status: eta === 0 ? Status.DELIVERED : currentStatus?.status,
  });
};

const driverUpdatesHandler = async (
  ctx: restate.RpcContext,
  event: restate.Event
) => {
  const eta = +event.body().toString();
  const currentStatus = await ctx.get<OrderStatus>(ORDER_STATUS);
  ctx.set(ORDER_STATUS, {
    eta: eta,
    status: eta === 0 ? Status.DELIVERED : currentStatus?.status,
  });
};

export const router = restate.keyedRouter({
  get,
  setStatus,
  setETA,
  eventHandler: restate.keyedEventHandler(driverUpdatesHandler),
});
export type orderStatusApi = typeof router;
export const service: restate.ServiceApi<orderStatusApi> = {
  path: "orderStatus",
};
