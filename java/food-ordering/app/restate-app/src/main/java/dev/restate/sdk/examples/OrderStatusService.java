package dev.restate.sdk.examples;

import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.generated.OrderProto;
import dev.restate.sdk.examples.generated.OrderStatusServiceRestate;
import dev.restate.sdk.examples.types.Status;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class OrderStatusService extends OrderStatusServiceRestate.OrderStatusServiceRestateImplBase {
    private static final Logger logger = LogManager.getLogger(OrderStatusService.class);

    private final StateKey<String> ORDER_STATUS = StateKey.of("order-status", CoreSerdes.STRING_UTF8);
    private final StateKey<Long> ORDER_ETA = StateKey.of("order-eta", CoreSerdes.LONG);

    @Override
    public OrderProto.OrderStatus get(RestateContext ctx, OrderProto.OrderId request) throws TerminalException {
        var orderStatusState = ctx.get(ORDER_STATUS).orElse("NEW");
        var status = Status.valueOf(orderStatusState);
        var eta = ctx.get(ORDER_ETA).orElse(-1L);
        return OrderProto.OrderStatus.newBuilder().setOrderId(request.getOrderId()).setStatus(OrderProto.Status.forNumber(status.getValue())).setEta(eta).build();
    }

    @Override
    public void setStatus(RestateContext ctx, OrderProto.OrderStatus request) throws TerminalException {
        ctx.set(ORDER_STATUS, request.getStatus().name().toString());
    }

    @Override
    public void setETA(RestateContext ctx, OrderProto.OrderStatus request) throws TerminalException {
        ctx.set(ORDER_ETA, request.getEta());
    }

    @Override
    public void handleDriverUpdate(RestateContext ctx, OrderProto.KafkaStringEvent event) throws TerminalException {
        var eta = Long.parseLong(event.getPayload());
        ctx.set(ORDER_ETA, eta);
    }
}



