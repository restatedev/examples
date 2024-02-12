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

package examples.order;

import static examples.order.generated.OrderProto.*;

import dev.restate.sdk.KeyedContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import examples.order.generated.OrderStatusServiceRestate;
import examples.order.types.StatusEnum;

public class OrderStatusService
    extends OrderStatusServiceRestate.OrderStatusServiceRestateImplBase {
  private static final StateKey<Long> ORDER_ETA = StateKey.of("order-eta", CoreSerdes.JSON_LONG);

  /** Gets called by the webUI frontend to display the status of an order. */
  @Override
  public OrderStatus get(KeyedContext ctx, OrderId request) throws TerminalException {
    var status = new OrderWorkflowRestateClient(ctx, request.getOrderId())
            .getState(OrderWorkflow.STATUS)
            .await()
            .orElse(StatusEnum.NEW);
    var eta = ctx.get(ORDER_ETA).orElse(-1L);
    return OrderStatus.newBuilder()
        .setOrderId(request.getOrderId())
        .setStatus(Status.forNumber(status.getValue()))
        .setEta(eta)
        .build();
  }

  @Override
  public void setETA(KeyedContext ctx, NewOrderETA request) throws TerminalException {
    ctx.set(ORDER_ETA, request.getEta());
  }
}
