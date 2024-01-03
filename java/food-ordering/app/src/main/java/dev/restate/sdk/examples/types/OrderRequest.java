package dev.restate.sdk.examples.types;

import com.fasterxml.jackson.annotation.JsonProperty;

public class OrderRequest {
    public String id;
    @JsonProperty("restaurant_id") public String restaurantId;
    public Product[] products;

    @JsonProperty("total_cost") public double totalCost;
    @JsonProperty("delivery_delay") public int deliveryDelay;

    public OrderRequest(String id, String restaurantId, Product[] products, double totalCost, int deliveryDelay) {
        this.id = id;
        this.restaurantId = restaurantId;
        this.products = products;
        this.totalCost = totalCost;
        this.deliveryDelay = deliveryDelay;
    }

    public OrderRequest() {
    }
}

