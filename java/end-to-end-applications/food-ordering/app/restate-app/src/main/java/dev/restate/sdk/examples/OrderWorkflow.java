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

import dev.restate.sdk.Context;
import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.common.Serde;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.clients.PaymentClient;
import dev.restate.sdk.examples.clients.RestaurantClient;
import dev.restate.sdk.examples.types.DeliveryRequest;
import dev.restate.sdk.examples.types.OrderRequest;
import dev.restate.sdk.examples.types.StatusEnum;
import java.time.Duration;

/**
 * Order processing workflow Gets called for each Kafka event that is published to the order topic.
 * The event contains the order ID and the raw JSON order. The workflow handles the payment, asks
 * the restaurant to start the preparation, and triggers the delivery.
 */
@Service
public class OrderWorkflow {
  private final RestaurantClient restaurant = RestaurantClient.get();
  private final PaymentClient paymentClnt = PaymentClient.get();

  @Handler
  public void create(Context ctx, OrderRequest order) throws TerminalException {
    String id = order.getOrderId();

    var orderStatusService = OrderStatusServiceClient.fromContext(ctx, id);

    // 1. Set status
    orderStatusService.setStatus(StatusEnum.CREATED);

    // 2. Handle payment
    String token = ctx.random().nextUUID().toString();
    boolean paid =
        ctx.run(
            "process payment",
            JsonSerdes.BOOLEAN,
            () -> paymentClnt.charge(id, token, order.getTotalCost()));

    if (!paid) {
      orderStatusService.setStatus(StatusEnum.REJECTED);
      return;
    }

    // 3. Schedule preparation
    orderStatusService.setStatus(StatusEnum.SCHEDULED);

    ctx.sleep(Duration.ofMillis(order.getDeliveryDelay()));

    // 4. Trigger preparation
    var preparationFuture = ctx.awakeable(Serde.VOID);
    ctx.run("notify restaurant", () -> restaurant.prepare(id, preparationFuture.id()));

    orderStatusService.setStatus(StatusEnum.IN_PREPARATION);
    preparationFuture.await();
    orderStatusService.setStatus(StatusEnum.SCHEDULING_DELIVERY);

    // 5. Find a driver and start delivery
    var deliveryAwakeable = ctx.awakeable(Serde.VOID);

    DeliveryManagerClient.fromContext(ctx, id)
        .send()
        .start(new DeliveryRequest(order.getRestaurantId(), deliveryAwakeable.id()));
    deliveryAwakeable.await();
    orderStatusService.setStatus(StatusEnum.DELIVERED);
  }
}
