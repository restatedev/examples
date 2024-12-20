import * as restate from "@restatedev/restate-sdk";
import {ObjectContext} from "@restatedev/restate-sdk";

/**
 * The product service is deployed somewhere as a Restate application.
 * We just need its type definition for the client here.
 */
const productService = restate.object({
    name: "product",
    handlers: {
        reserve: async (ctx: ObjectContext) => {
            if(await ctx.get("reserved")) {
                console.log("Product already reserved", ctx.key);
                return false;
            }
            console.log("Reserving product", ctx.key);
            ctx.set("reserved", true)
            return true;
        },
    },
});

export type ProductService = typeof productService;

restate.endpoint().bind(productService).listen(9080);