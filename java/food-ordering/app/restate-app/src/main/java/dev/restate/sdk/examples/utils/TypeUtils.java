package dev.restate.sdk.examples.utils;

import dev.restate.sdk.examples.generated.OrderProto;
import dev.restate.sdk.examples.types.Status;

public class TypeUtils {
  public static OrderProto.OrderStatus statusToProto(String id, Status status) {
    return OrderProto.OrderStatus.newBuilder()
        .setOrderId(id)
        .setStatus(OrderProto.Status.valueOf(status.name()))
        .build();
  }

  public static OrderProto.OrderId toOrderIdProto(String id) {
    return OrderProto.OrderId.newBuilder().setOrderId(id).build();
  }

}
