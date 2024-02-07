import { OrderStatus, Status } from "./types/types";
import * as restate from "@restatedev/restate-sdk";

const ORDER_STATUS = "order_status";

export const service: restate.ServiceApi<typeof router> = { path: "order-status" };

export const router = restate.keyedRouter({
  /** Gets called by the webUI frontend to display the status of an order. */
  get: async (ctx: restate.RpcContext, _orderId: string) =>
      ctx.get<OrderStatus>(ORDER_STATUS),

  setStatus: async (ctx: restate.RpcContext, orderId: string, status: Status ) => {
    console.info(`[${orderId}] Order is ${status}`);
    const currentStatus = await ctx.get<OrderStatus>(ORDER_STATUS);
    ctx.set(ORDER_STATUS, { ...currentStatus, ...{ status } });
  },

  setETA: async (ctx: restate.RpcContext, orderId: string, eta: number) => {
    const currentStatus = await ctx.get<OrderStatus>(ORDER_STATUS);
    ctx.set(ORDER_STATUS, {
      eta: eta,
      status: eta === 0 ? Status.DELIVERED : currentStatus?.status,
    });
  },

  eventHandler: restate.keyedEventHandler(async (ctx: restate.RpcContext, event: restate.Event) => {
    const eta = +event.body().toString();
    const currentStatus = await ctx.get<OrderStatus>(ORDER_STATUS);
    ctx.set(ORDER_STATUS, {
      eta: eta,
      status: eta === 0 ? Status.DELIVERED : currentStatus?.status,
    });
  }),
});