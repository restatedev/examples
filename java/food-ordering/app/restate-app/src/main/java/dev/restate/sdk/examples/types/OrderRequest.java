package dev.restate.sdk.examples.types;

import com.fasterxml.jackson.annotation.JsonProperty;

public class OrderRequest {
  @JsonProperty("order_id")
  public String orderId;

  @JsonProperty("restaurant_id")
  public String restaurantId;

  public Product[] products;

  @JsonProperty("total_cost")
  public double totalCost;

  @JsonProperty("delivery_delay")
  public int deliveryDelay;

  public OrderRequest(
      String orderId,
      String restaurantId,
      Product[] products,
      double totalCost,
      int deliveryDelay) {
    this.orderId = orderId;
    this.restaurantId = restaurantId;
    this.products = products;
    this.totalCost = totalCost;
    this.deliveryDelay = deliveryDelay;
  }

  public OrderRequest() {}
}
