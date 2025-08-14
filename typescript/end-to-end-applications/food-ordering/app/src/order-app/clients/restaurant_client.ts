/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

import axios from "axios";

const RESTAURANT_ENDPOINT = process.env.RESTAURANT_ENDPOINT || "http://localhost:5050";
const RESTAURANT_TOKEN = process.env.RESTAURANT_TOKEN;

export interface RestaurantClient {
  prepare(orderId: string): Promise<void>;
}

class RestaurantClientImpl implements RestaurantClient {
  async prepare(orderId: string) {
    await axios.post(
      `${RESTAURANT_ENDPOINT}/prepare`,
      { orderId },
      {
        headers: {
          "Content-Type": "application/json",
          ...(RESTAURANT_TOKEN && {
            Authorization: `Bearer ${RESTAURANT_TOKEN}`,
          }),
        },
      },
    );
  }
}

export function getRestaurantClient(): RestaurantClient {
  return new RestaurantClientImpl();
}
