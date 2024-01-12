package dev.restate.sdk.examples.utils;

import dev.restate.sdk.examples.generated.OrderProto.*;
import dev.restate.sdk.examples.types.StatusEnum;

public class TypeUtils {
  public static OrderStatus statusToProto(String id, StatusEnum statusEnum) {
    return OrderStatus.newBuilder()
        .setOrderId(id)
        .setStatus(Status.valueOf(statusEnum.name()))
        .build();
  }

  public static OrderId toOrderIdProto(String id) {
    return OrderId.newBuilder().setOrderId(id).build();
  }
}
