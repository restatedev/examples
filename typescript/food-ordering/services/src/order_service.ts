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

import {
  CancelOrderRequest,
  CreateOrderRequest,
  OrderService,
  OrderServiceClientImpl,
  PrepareOrderRequest,
  OrderStatusRequest,
  OrderStatusResponse,
} from "./generated/proto/example";
import { BoolValue } from "./generated/proto/google/protobuf/wrappers";
import * as restate from "@restatedev/restate-sdk";
import { OrderStatus } from "./types/types";
import { PointOfSalesApiClient } from "./aux/point_of_sales_api_client";
import { DeliveryProviderApiClient } from "./aux/delivery_provider_api_client";
import { Empty } from "./generated/proto/google/protobuf/empty";

// keyed by orderId
export class OrderSvc implements OrderService {
  STATUS = "status";
  pointOfSalesApiClient = new PointOfSalesApiClient();
  deliveryProviderApiClient = new DeliveryProviderApiClient();

  async createOrder(request: CreateOrderRequest): Promise<BoolValue> {
    const ctx = restate.useContext(this);

    if (!request.order) {
      return BoolValue.create({ value: false });
    }

    // 1. Check if restaurant open
    const restaurantOpen = await ctx.sideEffect(async () =>
      this.pointOfSalesApiClient.checkIfRestaurantOpen(
        request.order!.deliveryDelay
      )
    );

    // 2. Check if products are in stock
    const productsInStock = await ctx.sideEffect(async () =>
      this.pointOfSalesApiClient.checkIfProductsInStock(request.order!.items)
    );

    // If the restaurant is open and the products are in stock, then accept the order
    if (restaurantOpen && productsInStock) {
      // 3. Set the order as accepted
      ctx.set(this.STATUS, OrderStatus.ACCEPTED);

      // 4. Notify the restaurant; create the order in their POS system
      await ctx.sideEffect(() =>
        this.pointOfSalesApiClient.createOrder(request.orderId, request.order!)
      );

      // 5. Schedule the prepare order request based on the desired delivery delay
      const client = new OrderServiceClientImpl(ctx);
      ctx.delayedCall(
        () =>
          client.prepareOrder(
            PrepareOrderRequest.create({ orderId: request.orderId })
          ),
        request.order?.deliveryDelay || 0
      );

      // 6. Notify the delivery provider of the acceptance
      return BoolValue.create({ value: true });
    } else {
      // Set the order as rejected
      ctx.set(this.STATUS, OrderStatus.REJECTED);

      // Notify the delivery provider of the rejection
      return BoolValue.create({ value: false });
    }
  }

  async prepareOrder(request: PrepareOrderRequest): Promise<Empty> {
    const ctx = restate.useContext(this);

    // 1. Retrieve the order status from Restate's state store
    // State is eagerly sent together with the request so this works on local state.
    const currentStatus = await ctx.get<OrderStatus>(this.STATUS);

    // Only prepare the order if it in accepted status.
    if (currentStatus === OrderStatus.ACCEPTED) {
      // 2. Set status to processing
      ctx.set(this.STATUS, OrderStatus.PROCESSING);

      // 3. Notify the restaurant to prepare the order
      const orderPreparationAwakeable = ctx.awakeable();
      await ctx.sideEffect(() =>
        this.pointOfSalesApiClient.prepareOrder(
          request.orderId,
          orderPreparationAwakeable.id
        )
      );

      // 3. Wait for the restaurant to notify us that the order is prepared
      // This promise gets resolved when the awakeableID is delivered back to Restate by the point of sales software of the restaurant
      await orderPreparationAwakeable.promise;

      // 4. Set the order status to PREPARED
      ctx.set(this.STATUS, OrderStatus.PREPARED);

      // 5. Tell the delivery provider to look for a driver and to deliver the order
      await ctx.sideEffect(async () =>
        this.deliveryProviderApiClient.requestOrderDelivery(request.orderId)
      );

      return {};
    } else {
      return {};
    }
  }

  async cancelOrder(request: CancelOrderRequest): Promise<BoolValue> {
    const ctx = restate.useContext(this);

    const currentStatus = await ctx.get<OrderStatus>(this.STATUS);

    // You can only cancel an order that is not yet being prepared or canceled
    if (currentStatus === OrderStatus.ACCEPTED) {
      ctx.set(this.STATUS, OrderStatus.CANCELED);

      // Notify the restaurant; cancel the order in their POS system
      await ctx.sideEffect(() =>
        this.pointOfSalesApiClient.cancelOrder(request.orderId)
      );

      // Notify the delivery app of the cancellation success
      return BoolValue.create({ value: true });
    } else {
      // Notify the delivery app of the cancellation failure
      return BoolValue.create({ value: false });
    }
  }

  async getOrderStatus(
    _request: OrderStatusRequest
  ): Promise<OrderStatusResponse> {
    const ctx = restate.useContext(this);

    const status =
      (await ctx.get<OrderStatus>(this.STATUS)) || OrderStatus.UNKNOWN;

    return OrderStatusResponse.create({ status: OrderStatus[status] });
  }
}
