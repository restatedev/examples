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

import {object, ObjectContext} from "@restatedev/restate-sdk";
import type { OrderWorkflow } from "../order_workflow/api";

const OrderWorkflowObject: OrderWorkflow = { name: "order-workflow"};

export default object({
  name: "order-status",
  handlers: {
    /** Gets called by the webUI frontend to display the status of an order. */
    get: async (ctx: ObjectContext) => {
      const eta = await ctx.get<number>("eta") ?? undefined;
      const status = await ctx.workflowClient(OrderWorkflowObject, ctx.key).getStatus() ?? undefined;
      return { eta, status }
    },

    setETA: async (ctx: ObjectContext, eta: number) => {
      ctx.set("eta", eta);
    },

    eventHandler: async (ctx: ObjectContext, eta: number) => {
      ctx.set("eta", eta);
    },
  },
});