package dev.restate.sdk.examples;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.clients.PaymentClient;

import dev.restate.sdk.examples.clients.RestaurantClient;
import dev.restate.sdk.examples.generated.DeliveryServiceRestate;
import dev.restate.sdk.examples.generated.OrderProto;
import dev.restate.sdk.examples.generated.OrderServiceRestate;
import dev.restate.sdk.examples.generated.OrderStatusServiceRestate;
import dev.restate.sdk.examples.types.OrderRequest;
import org.apache.logging.log4j.core.Core;

import java.time.Duration;
import java.util.UUID;

import static dev.restate.sdk.examples.utils.TypeUtils.statusToProto;


public class OrderService extends OrderServiceRestate.OrderServiceRestateImplBase {
    private final RestaurantClient restaurant = RestaurantClient.get();

    @Override
    public void handleEvent(RestateContext ctx, OrderProto.KafkaBytesEvent event) throws TerminalException {
        ObjectMapper mapper = new ObjectMapper();

        var orderStatusSend = OrderStatusServiceRestate.newClient(ctx).oneWay();
        var paymentClnt = PaymentClient.get();

        try {
            OrderRequest order = mapper.readValue(event.getPayload().toStringUtf8(), OrderRequest.class);
            System.out.println("Received order: " + event.getPayload().toStringUtf8());

            // 1. Set status
            orderStatusSend.setStatus(statusToProto(order.id, OrderProto.Status.CREATED));

            // 2. Handle payment
            String token = ctx.sideEffect(CoreSerdes.STRING_UTF8, () -> UUID.randomUUID().toString());
            boolean paid = ctx.sideEffect(CoreSerdes.BOOLEAN, () ->
                    paymentClnt.charge(order.id, token, order.totalCost));

            if(!paid) {
                orderStatusSend.setStatus(statusToProto(order.id, OrderProto.Status.REJECTED));
                return;
            }

            // 3. Schedule preparation
            orderStatusSend.setStatus(statusToProto(order.id, OrderProto.Status.SCHEDULED));
            ctx.sleep(Duration.ofMillis(order.deliveryDelay));

            // 4. Trigger preparation
            var preparationAwakeable = ctx.awakeable(CoreSerdes.VOID);
            ctx.sideEffect(() -> restaurant.prepare(order.id, preparationAwakeable.id()));
            orderStatusSend.setStatus(statusToProto(order.id, OrderProto.Status.IN_PREPARATION));

            preparationAwakeable.await();
            orderStatusSend.setStatus(statusToProto(order.id, OrderProto.Status.SCHEDULING_DELIVERY));

            //5. Find a driver and start delivery
            var deliveryAwakeable = ctx.awakeable(CoreSerdes.VOID);
            var deliveryClnt = DeliveryServiceRestate.newClient(ctx);
            var orderProto = OrderProto.Order.newBuilder().setId(order.id).setRestaurantId(order.restaurantId).build();
            var deliveryRequest = OrderProto.DeliveryRequest.newBuilder().setId(order.id).setOrder(orderProto).setCallback(deliveryAwakeable.id()).build();
            deliveryClnt.oneWay().start(deliveryRequest);
            deliveryAwakeable.await();
            orderStatusSend.setStatus(statusToProto(order.id, OrderProto.Status.DELIVERED));
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
