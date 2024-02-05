/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import {
  InventoryRestockService,
  NewQuantityInStock,
  ProductOrderRequest,
  ProductServiceClientImpl,
} from "./generated/proto/shoppingcart";
import { Empty } from "./generated/proto/google/protobuf/empty";

export class InventoryRestockSvc implements InventoryRestockService {
  async orderProduct(request: ProductOrderRequest): Promise<Empty> {
    const ctx = restate.useContext(this);

    const productServiceClient = new ProductServiceClientImpl(ctx);
    await ctx.delayedCall(
      () =>
        productServiceClient.notifyNewQuantityInStock(
          NewQuantityInStock.create({ productId: request.productId, amount: 1 })
        ),
      15000
    );

    return Empty.create();
  }
}
