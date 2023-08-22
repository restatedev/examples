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
  AddProductRequest,
  AddProductResponse,
  CheckoutFlowRequest,
  CheckoutFlowServiceClientImpl,
  CheckoutRequest,
  CheckoutResponse,
  CheckoutResponse_EmptyCart,
  CreateCartRequest,
  GetAllProductsRequest,
  GetAllProductsResponse,
  GetAllProductsResponse_Product,
  ProductServiceClientImpl,
  ReleaseRequest,
  RemoveProductRequest,
  ReservationRequest,
  ShoppingCartData,
  ShoppingCartService,
} from "./generated/proto/shoppingcart";
import { Empty } from "./generated/proto/google/protobuf/empty";
import { TerminalError } from "@restatedev/restate-sdk";

enum CartStatus {
  UNKNOWN = "UNKNOWN",
  ACTIVE = "ACTIVE",
  CHECKED_OUT = "CHECKED_OUT",
}

export class ShoppingCartSvc implements ShoppingCartService {
  async createCart(request: CreateCartRequest): Promise<Empty> {
    const ctx = restate.useContext(this);

    await this.requireState(ctx, CartStatus.UNKNOWN);

    ctx.set("user_id", request.userId);
    ctx.set("status", CartStatus.ACTIVE);

    return Empty.create();
  }

  async addProduct(request: AddProductRequest): Promise<AddProductResponse> {
    const ctx = restate.useContext(this);

    await this.requireState(ctx, CartStatus.ACTIVE);

    const productService = new ProductServiceClientImpl(ctx);
    const reservation = await productService.reserve(
      ReservationRequest.create({ productId: request.productId })
    );

    if (!reservation.reservationSuccess) {
      return AddProductResponse.create({ success: false });
    }

    const cart =
      (await ctx.get<ShoppingCartData>("cart")) || ShoppingCartData.create();
    cart.reservations.push(reservation);
    ctx.set("cart", cart);

    return AddProductResponse.create({ success: true });
  }

  async removeProduct(request: RemoveProductRequest): Promise<Empty> {
    const ctx = restate.useContext(this);

    await this.requireState(ctx, CartStatus.ACTIVE);

    const productService = new ProductServiceClientImpl(ctx);
    await productService.release(
      ReleaseRequest.create({ productId: request.productId })
    );

    const cart =
      (await ctx.get<ShoppingCartData>("cart")) || ShoppingCartData.create();
    cart.reservations = cart.reservations.filter(
      (res) => res.productId !== request.productId
    );
    ctx.set("cart", cart);

    return Empty.create();
  }

  async getAllProducts(
    _request: GetAllProductsRequest
  ): Promise<GetAllProductsResponse> {
    const ctx = restate.useContext(this);

    const shoppingCart = GetAllProductsResponse.create();

    const cart =
      (await ctx.get<ShoppingCartData>("cart")) || ShoppingCartData.create();
    const products = cart.reservations.map((res) =>
      GetAllProductsResponse_Product.create({
        productId: res.productId,
        priceInCents: res.priceInCents,
      })
    );

    shoppingCart.product.push(...products);
    shoppingCart.status = (
      (await ctx.get<CartStatus>("status")) || CartStatus.UNKNOWN
    )
      .toString()
      .toLowerCase();
    return shoppingCart;
  }

  async checkout(request: CheckoutRequest): Promise<CheckoutResponse> {
    const ctx = restate.useContext(this);

    const cartStatus =
      (await ctx.get<CartStatus>("status")) || CartStatus.UNKNOWN;

    if (cartStatus === CartStatus.CHECKED_OUT) {
      // this cart was already checked out, we are going to be nice and reply with the previous
      // checkout reply.
      const previous = await ctx.get<CheckoutResponse>("checkout_response");
      if (!previous) {
        throw new TerminalError(
          "Cart status is CHECKED_OUT but cannot find previous checkout response."
        );
      } else {
        return previous;
      }
    }

    const products =
      (await ctx.get<ShoppingCartData>("cart")) || ShoppingCartData.create();
    if (products.reservations.length === 0) {
      return CheckoutResponse.create({
        emptyCart: CheckoutResponse_EmptyCart.create(),
      });
    }

    const userId = await ctx.get<string>("user_id");
    if (!userId)
      throw new TerminalError("No user id defined in Restate state.");

    const checkoutClient = new CheckoutFlowServiceClientImpl(ctx);
    const result = await checkoutClient.start(
      CheckoutFlowRequest.create({
        reservedProducts: products.reservations,
        shoppingCartId: request.shoppingCartId,
        userId: userId,
      })
    );

    if (result.checkoutSuccess !== undefined) {
      // sweet, we have checked out successfully,
      // we switch to CHECKED_OUT (final) state.
      ctx.set("status", CartStatus.CHECKED_OUT);
    }

    ctx.set("checkout_response", result);
    return result;
  }

  async requireState(ctx: restate.RestateContext, requiredStatus: CartStatus) {
    const cartStatus =
      (await ctx.get<CartStatus>("status")) || CartStatus.UNKNOWN;
    if (cartStatus !== requiredStatus) {
      throw new TerminalError(
        `Illegal State: Cart creation failed. Cart status is ${cartStatus} but has to be ${requiredStatus}.`
      );
    }
  }
}
