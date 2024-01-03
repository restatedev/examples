package dev.restate.sdk.examples;

import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import static dev.restate.sdk.examples.generated.OrderProto.*;

import dev.restate.sdk.examples.generated.OrderProto;
import dev.restate.sdk.examples.generated.OrderStatusServiceRestate;

public class OrderStatusService extends OrderStatusServiceRestate.OrderStatusServiceRestateImplBase {

    private final StateKey<String> ORDER_STATUS = StateKey.of("order-status", CoreSerdes.STRING_UTF8);
    private final StateKey<Long> ORDER_ETA = StateKey.of("order-eta", CoreSerdes.LONG);

    @Override
    public OrderProto.OrderStatus get(RestateContext ctx, OrderId request) throws TerminalException {
        var status = ctx.get(ORDER_STATUS).orElse("UNKNOWN");
        var eta = ctx.get(ORDER_ETA).orElse(-1L);
        return OrderStatus.newBuilder().setId(request.getId()).setStatus(Status.valueOf(status)).setEta(eta).build();
    }

    @Override
    public void setStatus(RestateContext ctx, OrderStatus request) throws TerminalException {
        ctx.set(ORDER_STATUS, request.getStatus().name());
    }

    @Override
    public void setETA(RestateContext ctx, OrderStatus request) throws TerminalException {
        ctx.set(ORDER_ETA, request.getEta());
    }

    @Override
    public void handleDriverUpdate(RestateContext ctx, KafkaStringEvent event) throws TerminalException {
        var eta = Long.parseLong(event.getPayload());
        ctx.set(ORDER_ETA, eta);
    }
}



