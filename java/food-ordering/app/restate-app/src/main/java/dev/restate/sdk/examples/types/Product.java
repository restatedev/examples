package dev.restate.sdk.examples.types;

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
