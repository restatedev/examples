package dev.restate.examples.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "product")
public class Product {

  @Id
  @Column(name = "id", updatable = false, columnDefinition = "varchar(255)")
  private String id;

  @Column(name = "quantity", nullable = false, columnDefinition = "int4")
  private int quantity;

  // NOTE: We use the price in cents to avoid rounding errors. e.g. 100 means 1 USD.
  @Column(name = "price_in_cents", nullable = false, columnDefinition = "numeric")
  private long priceInCents;

  public Product() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public int getQuantity() {
    return quantity;
  }

  public void setQuantity(int quantity) {
    this.quantity = quantity;
  }

  public long getPriceInCents() {
    return priceInCents;
  }

  public void setPriceInCents(long priceInCents) {
    this.priceInCents = priceInCents;
  }
}
