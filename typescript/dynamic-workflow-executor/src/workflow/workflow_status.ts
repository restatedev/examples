import * as restate from "@restatedev/restate-sdk";
import {WorfklowStatus} from "../types/types";

export const router = restate.keyedRouter({
    get: async (ctx: restate.RpcContext, id: string) => {
        const status = await ctx.get<WorfklowStatus>("status") ?? "{}";
        return status;
    },

    update: async (ctx: restate.RpcContext, id: string, newStatus: WorfklowStatus) => {
        ctx.set("status", newStatus);
    }
})

export const service: restate.ServiceApi<typeof router> = { path: "workflow-status"}