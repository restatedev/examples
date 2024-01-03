package dev.restate.sdk.examples.types;

import dev.restate.sdk.examples.generated.OrderProto;

public enum Status {
  NEW(0),
  CREATED(1),
  SCHEDULED(2),
  IN_PREPARATION(3),
  SCHEDULING_DELIVERY(4),
  WAITING_FOR_DRIVER(5),
  IN_DELIVERY(6),
  DELIVERED(7),
  REJECTED(8),
  CANCELLED(9),
  UNKNOWN(10);

  private final int value;

  Status(int value) {
    this.value = value;
  }

  public int getValue() {
    return value;
  }
}
