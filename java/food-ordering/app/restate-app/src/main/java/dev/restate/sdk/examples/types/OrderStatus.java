package dev.restate.sdk.examples.types;

class OrderStatus {
  private Status status;
  private long eta;

  public OrderStatus(Status status, long eta) {
    this.status = status;
    this.eta = eta;
  }

  public Status getStatus() {
    return status;
  }

  public long getEta() {
    return eta;
  }

  public OrderStatus setStatus(Status status) {
    this.status = status;
    return this;
  }

  public OrderStatus setEta(long eta) {
    this.eta = eta;
    return this;
  }
}
