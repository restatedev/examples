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
import {WorfklowStatus} from "../types/types";

export const router = restate.keyedRouter({
    get: async (ctx: restate.KeyedContext, id: string) => {
        const status = await ctx.get<WorfklowStatus>("status") ?? "{}";
        return status;
    },

    update: async (ctx: restate.KeyedContext, id: string, newStatus: WorfklowStatus) => {
        ctx.set("status", newStatus);
    }
})

export const service: restate.ServiceApi<typeof router> = { path: "workflow-status"}