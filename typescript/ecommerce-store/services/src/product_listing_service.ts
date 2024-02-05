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

import {
  ListAllProductsResponse,
  ListAllProductsResponse_ProductData,
  ProductListingService,
} from "./generated/proto/shoppingcart";
import { Empty } from "./generated/proto/google/protobuf/empty";
import Product from "./model/product";

export class ProductListingSvc implements ProductListingService {
  async listAllProducts(_request: Empty): Promise<ListAllProductsResponse> {
    const products = await Product.findAll();

    const response = ListAllProductsResponse.create({});
    products.forEach((p) => {
      response.products.push(p as ListAllProductsResponse_ProductData);
    });

    return response;
  }
}
