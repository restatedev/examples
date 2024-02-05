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

package dev.restate.sdk.examples;

import static dev.restate.sdk.examples.generated.OrderProto.*;

import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.generated.OrderStatusServiceRestate;
import dev.restate.sdk.examples.types.StatusEnum;

public class OrderStatusService
    extends OrderStatusServiceRestate.OrderStatusServiceRestateImplBase {
  private static final StateKey<String> ORDER_STATUS =
      StateKey.of("order-status", CoreSerdes.STRING_UTF8);
  private static final StateKey<Long> ORDER_ETA = StateKey.of("order-eta", CoreSerdes.LONG);

  /** Gets called by the webUI frontend to display the status of an order. */
  @Override
  public OrderStatus get(RestateContext ctx, OrderId request) throws TerminalException {
    var orderStatusState = ctx.get(ORDER_STATUS).orElse("NEW");
    var status = StatusEnum.valueOf(orderStatusState);
    var eta = ctx.get(ORDER_ETA).orElse(-1L);
    return OrderStatus.newBuilder()
        .setOrderId(request.getOrderId())
        .setStatus(Status.forNumber(status.getValue()))
        .setEta(eta)
        .build();
  }

  @Override
  public void setStatus(RestateContext ctx, OrderStatus request) throws TerminalException {
    ctx.set(ORDER_STATUS, request.getStatus().name());
  }

  @Override
  public void setETA(RestateContext ctx, OrderStatus request) throws TerminalException {
    ctx.set(ORDER_ETA, request.getEta());
  }
}
