import * as restate from "@restatedev/restate-sdk";
import { ObjectContext } from "@restatedev/restate-sdk";

/**
 * The product service is deployed somewhere as a Restate application.
 * It is a virtual object that makes sure only one reservation is made concurrently.
 */
const productService = restate.object({
  name: "product",
  handlers: {
    reserve: async (ctx: ObjectContext) => {
      if (await ctx.get("reserved")) {
        console.log("Product already reserved");
        return false;
      }
      console.log("Reserving product");
      ctx.set("reserved", true);
      return true;
    },
  },
});

export type ProductService = typeof productService;

restate.endpoint().bind(productService).listen(9080);
