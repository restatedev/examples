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

import { OrderStatus, Status } from "../types/types";
import {object, ObjectContext} from "@restatedev/restate-sdk";

const ORDER_STATUS = "order_status";

export default object({
  name: "order-status",
  handlers: {
    /** Gets called by the webUI frontend to display the status of an order. */
    get: async (ctx: ObjectContext) => ctx.get<OrderStatus>(ORDER_STATUS),

    setStatus: async (ctx: ObjectContext, status: Status) => {
      ctx.console.info(`[${ctx.key}] Order is ${status}`);
      const currentStatus = await ctx.get<OrderStatus>(ORDER_STATUS);
      ctx.set(ORDER_STATUS, { ...currentStatus, ...{ status } });
    },

    setETA: async (ctx: ObjectContext, eta: number) => {
      const currentStatus = await ctx.get<OrderStatus>(ORDER_STATUS);
      ctx.set(ORDER_STATUS, {
        eta: eta,
        status: eta === 0 ? Status.DELIVERED : currentStatus?.status,
      });
    },

    eventHandler: async (ctx: ObjectContext, eta: number) => {
      const currentStatus = await ctx.get<OrderStatus>(ORDER_STATUS);
      ctx.set(ORDER_STATUS, {
        eta: eta,
        status: eta === 0 ? Status.DELIVERED : currentStatus?.status,
      });
    },
  },
});