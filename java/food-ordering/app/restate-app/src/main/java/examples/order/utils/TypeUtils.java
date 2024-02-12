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

package examples.order.utils;

import examples.order.generated.OrderProto;

public class TypeUtils {

  public static OrderProto.OrderId toOrderIdProto(String id) {
    return OrderProto.OrderId.newBuilder().setOrderId(id).build();
  }
}
