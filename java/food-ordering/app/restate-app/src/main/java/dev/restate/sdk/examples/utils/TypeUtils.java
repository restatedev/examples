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
