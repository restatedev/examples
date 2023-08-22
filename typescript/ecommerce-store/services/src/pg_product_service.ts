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
import Product, { sequelize } from "./model/product";
import { QueryTypes } from "sequelize";

export class PgProductSvc implements ProductService {
  opts = { model: Product, mapToModel: true };
  async getProductInformation(
    request: GetProductInformationRequest
  ): Promise<GetProductInformationResponse> {
    const [product] = await sequelize.query(
      `SELECT * FROM product WHERE id = '${request.productId}'`,
      this.opts
    );

    return GetProductInformationResponse.create({
      productId: request.productId,
      priceInCents: product?.priceInCents ?? 0.0,
      quantity: product?.quantity ?? 0,
    });
  }

  async reserve(request: ReservationRequest): Promise<Reservation> {
    const ctx = restate.useContext(this);

    // Get the product data from the database
    const [product] = await sequelize.query(
      `SELECT * FROM product WHERE id = '${request.productId}'`,
      this.opts
    );
    // If no product present, send back a reservation failure
    if (!product) {
      return Reservation.create({
        reservationSuccess: false,
        productId: request.productId,
      });
    }
    // Save the version tag in Restate
    const savedVersionTag = await ctx.sideEffect(
      async () => product.versionTag
    );

    // Decrement the quantity if the version tag is still valid
    const [_result, numRowsUpdated] = await sequelize.query(
      `UPDATE Product
      SET quantity = quantity - 1, version_tag = version_tag + 1
      WHERE id = '${request.productId}' AND quantity > 0 
      AND version_tag = ${savedVersionTag}`,
      { type: QueryTypes.UPDATE }
    );

    if (numRowsUpdated > 0) {
      return Reservation.create({
        reservationSuccess: true,
        productId: request.productId,
        priceInCents: product.priceInCents,
      });
    } else {
      return Reservation.create({
        reservationSuccess: false,
        productId: request.productId,
      });
    }
  }

  async release(request: ReleaseRequest): Promise<Empty> {
    const ctx = restate.useContext(this);

    // Get the product data from the database
    const [product] = await sequelize.query(
      `SELECT * FROM product WHERE id = '${request.productId}'`,
      this.opts
    );

    if (product) {
      // Save the version tag in Restate
      const savedVersionTag = await ctx.sideEffect(
        async () => product.versionTag
      );

      // Increment the quantity if the version tag is still valid
      await sequelize.query(
        `UPDATE Product
      SET quantity = quantity + 1, version_tag = version_tag + 1
      WHERE id = '${request.productId}' AND quantity > 0 
      AND version_tag = ${savedVersionTag}`,
        { type: QueryTypes.UPDATE }
      );
    }

    return Empty.create();
  }

  async notifyProductSold(request: NotifyProductSoldEvent): Promise<Empty> {
    const ctx = restate.useContext(this);

    // Get the product from the database
    const [product] = await sequelize.query(
      `SELECT * FROM product WHERE id = '${request.productId}'`,
      this.opts
    );

    // If the product exists and the quantity is 0, then restock
    if (product && product.quantity === 0) {
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

    // Get the product data from the database
    const [product] = await sequelize.query(
      `SELECT * FROM product WHERE id = '${request.productId}'`,
      this.opts
    );

    if (product) {
      // Save the version tag in Restate
      const savedVersionTag = await ctx.sideEffect(
        async () => product.versionTag
      );

      const newQuantity = product.quantity + 1;
      const newPrice =
        request.newPriceInCents === 0
          ? product.priceInCents
          : request.newPriceInCents;

      await sequelize.query(
        `UPDATE Product
        SET quantity = ${newQuantity}, price_in_cents = ${newPrice}, version_tag = version_tag + 1
        WHERE id = '${request.productId}'
        AND version_tag = ${savedVersionTag}`,
        { type: QueryTypes.UPDATE }
      );
    }

    return Empty.create();
  }
}
