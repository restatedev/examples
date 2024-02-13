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

package examples.order.types;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Product {

  private final String productId;
  private final String description;
  private final int quantity;

  public Product(
      @JsonProperty("productId") String productId,
      @JsonProperty("description") String description,
      @JsonProperty("quantity") int quantity) {
    this.productId = productId;
    this.description = description;
    this.quantity = quantity;
  }
}
