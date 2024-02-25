import * as restate from "@restatedev/restate-sdk";
import { durablePromise } from "./durable_promises";


const example = restate.router({

    call: async (ctx: restate.RpcContext) => {
        return await durablePromise(ctx, "myPromise");
    },

    complete: async (ctx: restate.RpcContext, value: any) => {
        const promise = durablePromise(ctx, "myPromise");
        promise.resolve(value);
        return await promise;
    },

    reject: async (ctx: restate.RpcContext, message: string) => {
        const promise = durablePromise(ctx, "myPromise");
        promise.reject(message);
        return await promise;
    }
})

restate.createServer().bindRouter("example", example).listen(9081);
