package dev.restate.sdk.examples;

import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.generated.OrderProto;
import dev.restate.sdk.examples.generated.OrderStatusServiceRestate;
import dev.restate.sdk.examples.types.Status;

public class OrderStatusService
    extends OrderStatusServiceRestate.OrderStatusServiceRestateImplBase {
  private final StateKey<String> ORDER_STATUS = StateKey.of("order-status", CoreSerdes.STRING_UTF8);
  private final StateKey<Long> ORDER_ETA = StateKey.of("order-eta", CoreSerdes.LONG);

  /** Gets called by the webUI frontend to display the status of an order. */
  @Override
  public OrderProto.OrderStatus get(RestateContext ctx, OrderProto.OrderId request)
      throws TerminalException {
    var orderStatusState = ctx.get(ORDER_STATUS).orElse("NEW");
    var status = Status.valueOf(orderStatusState);
    var eta = ctx.get(ORDER_ETA).orElse(-1L);
    return OrderProto.OrderStatus.newBuilder()
        .setOrderId(request.getOrderId())
        .setStatus(OrderProto.Status.forNumber(status.getValue()))
        .setEta(eta)
        .build();
  }

  @Override
  public void setStatus(RestateContext ctx, OrderProto.OrderStatus request)
      throws TerminalException {
    ctx.set(ORDER_STATUS, request.getStatus().name());
  }

  @Override
  public void setETA(RestateContext ctx, OrderProto.OrderStatus request) throws TerminalException {
    ctx.set(ORDER_ETA, request.getEta());
  }
}
