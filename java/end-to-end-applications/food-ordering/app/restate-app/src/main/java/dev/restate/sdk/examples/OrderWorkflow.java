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

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
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
  public void create(OrderRequest order) throws TerminalException {
    String id = order.getOrderId();

    var orderStatusService = Restate.virtualObject(OrderStatusService.class, id);

    // 1. Set status
    orderStatusService.setStatus(StatusEnum.CREATED);

    // 2. Handle payment
    String token = Restate.random().nextUUID().toString();
    boolean paid =
        Restate.run(
            "process payment",
            Boolean.TYPE,
            () -> paymentClnt.charge(id, token, order.getTotalCost()));

    if (!paid) {
      orderStatusService.setStatus(StatusEnum.REJECTED);
      return;
    }

    // 3. Schedule preparation
    orderStatusService.setStatus(StatusEnum.SCHEDULED);

    Restate.sleep(Duration.ofMillis(order.getDeliveryDelay()));

    // 4. Trigger preparation
    var preparationFuture = Restate.awakeable(Void.class);
    Restate.run("notify restaurant", () -> restaurant.prepare(id, preparationFuture.id()));

    orderStatusService.setStatus(StatusEnum.IN_PREPARATION);
    preparationFuture.await();
    orderStatusService.setStatus(StatusEnum.SCHEDULING_DELIVERY);

    // 5. Find a driver and start delivery
    var deliveryAwakeable = Restate.awakeable(Void.class);

    Restate.virtualObjectHandle(DeliveryManager.class, id)
        .send(
            DeliveryManager::start,
            new DeliveryRequest(order.getRestaurantId(), deliveryAwakeable.id()));
    deliveryAwakeable.await();
    orderStatusService.setStatus(StatusEnum.DELIVERED);
  }
}
