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

import axios from "axios";
import { Order, OrderItem } from "../generated/proto/example";

export class PointOfSalesApiClient {
  POS_ENDPOINT = process.env.POS_ENDPOINT || "http://localhost:5050";

  public async createOrder(orderId: string, order: Order) {
    // Sends request to the point of sales server of the restaurant to create the order
    const data = {
      orderId: orderId,
      order: order,
    };
    await axios.post(`${this.POS_ENDPOINT}/create`, data, {
      headers: { "Content-Type": "application/json" },
    });
  }

  public async cancelOrder(orderId: string) {
    // Sends request to the point of sales server of the restaurant to cancel the order
    await axios.post(
      `${this.POS_ENDPOINT}/cancel`,
      { orderId: orderId },
      { headers: { "Content-Type": "application/json" } }
    );
  }

  public async prepareOrder(orderId: string, awakeableId: string) {
    // Sends request to the point of sales server of the restaurant to prepare the order
    const data = { awakeableId: awakeableId, orderId: orderId };
    await axios.post(`${this.POS_ENDPOINT}/prepare`, data, {
      headers: { "Content-Type": "application/json" },
    });
  }

  public checkIfRestaurantOpen(_deliveryTime: number) {
    // here should be some logic which sends a request to the point of sales API client
    // to check if the restaurant is open
    return true;
  }

  public checkIfProductsInStock(_items: OrderItem[]) {
    // here should be some logic which checks if all the products are in stock
    return true;
  }
}
