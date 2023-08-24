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

export interface Order {
  restaurantId: string;
  deliveryDelay: number;
  items: OrderItem[];
}

export interface OrderItem {
  productName: string;
  quantity: number;
}

export enum OrderStatus {
  UNKNOWN,
  ACCEPTED,
  PROCESSING,
  PREPARED,
  REJECTED,
  CANCELED,
}
