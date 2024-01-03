package dev.restate.sdk.examples;

import static dev.restate.sdk.examples.utils.TypeUtils.statusToProto;

import com.fasterxml.jackson.core.JsonProcessingException;
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
import dev.restate.sdk.examples.types.Status;
import java.time.Duration;
import java.util.UUID;

public class OrderService extends OrderServiceRestate.OrderServiceRestateImplBase {
  private final RestaurantClient restaurant = RestaurantClient.get();
  private final PaymentClient paymentClnt = PaymentClient.get();

  @Override
  public void handleOrderCreationEvent(RestateContext ctx, OrderProto.KafkaOrderEvent event)
      throws TerminalException {
    var orderStatusSend = OrderStatusServiceRestate.newClient(ctx);

    try {
      ObjectMapper mapper = new ObjectMapper();
      OrderRequest order = mapper.readValue(event.getPayload().toStringUtf8(), OrderRequest.class);

      // 1. Set status
      orderStatusSend.oneWay().setStatus(statusToProto(order.orderId, Status.CREATED));

      // 2. Handle payment
      String token = ctx.sideEffect(CoreSerdes.STRING_UTF8, () -> UUID.randomUUID().toString());
      boolean paid =
          ctx.sideEffect(
              CoreSerdes.BOOLEAN, () -> paymentClnt.charge(order.orderId, token, order.totalCost));

      if (!paid) {
        orderStatusSend.oneWay().setStatus(statusToProto(order.orderId, Status.REJECTED));
        return;
      }

      // 3. Schedule preparation
      orderStatusSend.setStatus(statusToProto(order.orderId, Status.SCHEDULED));
      ctx.sleep(Duration.ofMillis(order.deliveryDelay));

      // 4. Trigger preparation
      var preparationAwakeable = ctx.awakeable(CoreSerdes.VOID);
      ctx.sideEffect(() -> restaurant.prepare(order.orderId, preparationAwakeable.id()));
      orderStatusSend.setStatus(statusToProto(order.orderId, Status.IN_PREPARATION));

      preparationAwakeable.await();
      orderStatusSend.setStatus(statusToProto(order.orderId, Status.SCHEDULING_DELIVERY));

      // 5. Find a driver and start delivery
      var deliveryAwakeable = ctx.awakeable(CoreSerdes.VOID);

      var deliveryRequest =
          OrderProto.DeliveryRequest.newBuilder()
              .setOrderId(order.orderId)
              .setRestaurantId(order.restaurantId)
              .setCallback(deliveryAwakeable.id())
              .build();
      DeliveryServiceRestate.newClient(ctx).oneWay().start(deliveryRequest);
      deliveryAwakeable.await();
      orderStatusSend.setStatus(statusToProto(order.orderId, Status.DELIVERED));
    } catch (JsonProcessingException e) {
      throw new TerminalException("Parsing raw JSON order failed: " + e.getMessage());
    }
  }
}
