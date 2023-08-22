/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
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
  GetProductInformationRequest,
  GetProductInformationResponse,
  InventoryRestockServiceClientImpl,
  NewQuantityInStock,
  NotifyProductSoldEvent,
  ProductOrderRequest,
  ProductService,
  ReleaseRequest,
  Reservation,
  ReservationRequest,
} from "./generated/proto/shoppingcart";
import { Empty } from "./generated/proto/google/protobuf/empty";
import { TerminalError } from "@restatedev/restate-sdk";

export class ProductSvc implements ProductService {
  async getProductInformation(
    request: GetProductInformationRequest
  ): Promise<GetProductInformationResponse> {
    const ctx = restate.useContext(this);

    const quantity = (await ctx.get<number>("quantity")) || 0;
    const price = (await ctx.get<number>("price")) || 0.0;

    return GetProductInformationResponse.create({
      productId: request.productId,
      priceInCents: price,
      quantity: quantity,
    });
  }

  async reserve(request: ReservationRequest): Promise<Reservation> {
    const ctx = restate.useContext(this);

    const quantity = (await ctx.get<number>("quantity")) || 0;
    if (quantity === 0) {
      return Reservation.create({
        reservationSuccess: false,
        productId: request.productId,
      });
    }

    ctx.set("quantity", quantity - 1);
    const price = await ctx.get<number>("price");
    if (!price)
      throw new TerminalError(
        "No price was set for this product " + request.productId
      );

    return Reservation.create({
      reservationSuccess: true,
      productId: request.productId,
      priceInCents: price,
    });
  }

  async release(_request: ReleaseRequest): Promise<Empty> {
    const ctx = restate.useContext(this);
    const quantity = (await ctx.get<number>("quantity")) || 0;
    ctx.set("quantity", quantity + 1);

    return Empty.create();
  }

  async notifyProductSold(request: NotifyProductSoldEvent): Promise<Empty> {
    const ctx = restate.useContext(this);
    const quantity = (await ctx.get<number>("quantity")) || 0;

    if (quantity === 0) {
      const inventoryRestockClient = new InventoryRestockServiceClientImpl(ctx);
      await ctx.oneWayCall(() =>
        inventoryRestockClient.orderProduct(
          ProductOrderRequest.create({ productId: request.productId })
        )
      );
    }
    return Empty.create();
  }

  async notifyNewQuantityInStock(request: NewQuantityInStock): Promise<Empty> {
    const ctx = restate.useContext(this);

    const quantity = (await ctx.get<number>("quantity")) || 0;
    ctx.set("quantity", quantity + request.amount);

    if (request.newPriceInCents != 0) {
      ctx.set("price", request.newPriceInCents);
    }

    return Empty.create();
  }
}
