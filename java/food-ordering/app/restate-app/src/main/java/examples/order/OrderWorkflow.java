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

import dev.restate.sdk.KeyedContext;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.annotation.ServiceType;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.Serde;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import examples.order.clients.PaymentClient;
import examples.order.clients.RestaurantClient;
import examples.order.generated.DriverDeliveryMatcherRestate;
import examples.order.generated.DriverDigitalTwinRestate;
import static examples.order.generated.OrderProto.*;
import examples.order.types.DeliveryInformation;
import examples.order.types.Location;
import examples.order.types.OrderRequest;
import examples.order.types.StatusEnum;
import examples.order.utils.GeoUtils;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.sdk.workflow.DurablePromiseKey;
import dev.restate.sdk.workflow.WorkflowContext;
import dev.restate.sdk.workflow.WorkflowSharedContext;
import org.apache.logging.log4j.core.Core;

import java.time.Duration;

/**
 * Order processing workflow Gets called for each Kafka event that is published to the order topic.
 * The event contains the order ID and the raw JSON order. The workflow handles the payment, asks
 * the restaurant to start the preparation, and triggers the delivery.
 */
@Service(ServiceType.WORKFLOW)
public class OrderWorkflow {

  public final static StateKey<StatusEnum> STATUS = StateKey.of("status", JacksonSerdes.of(StatusEnum.class));
  private static final StateKey<String> DRIVER_ID = StateKey.of("driver-id", CoreSerdes.JSON_STRING);

  private static final Serde<Location> LOCATION_SERDE = JacksonSerdes.of(Location.class);

  private static final DurablePromiseKey<Void> PICKED_UP_SIGNAL = DurablePromiseKey.of("delivery-picked-up", CoreSerdes.VOID);
  private static final DurablePromiseKey<Void> DELIVERED_SIGNAL = DurablePromiseKey.of("delivery-delivered", CoreSerdes.VOID);

  private final RestaurantClient restaurant = RestaurantClient.get();
  private final PaymentClient paymentClnt = PaymentClient.get();

  @Workflow
  public void run(WorkflowContext ctx, OrderRequest order)
      throws TerminalException {
    String orderId = ctx.workflowKey();
    ctx.set(STATUS, StatusEnum.CREATED);

    // 2. Handle payment
    String token = ctx.random().nextUUID().toString();
    boolean paid =
        ctx.sideEffect(
            CoreSerdes.JSON_BOOLEAN, () -> paymentClnt.charge(orderId, token, order.getTotalCost()));

    if (!paid) {
      ctx.set(STATUS, StatusEnum.REJECTED);
      return;
    }
    ctx.set(STATUS, StatusEnum.SCHEDULED);

    ctx.sleep(Duration.ofMillis(order.getDeliveryDelay()));

    // 4. Trigger preparation
    var preparationAwakeable = ctx.awakeable(CoreSerdes.VOID);
    ctx.sideEffect(() -> restaurant.prepare(orderId, preparationAwakeable.id()));
    ctx.set(STATUS, StatusEnum.IN_PREPARATION);
    preparationAwakeable.await();
    ctx.set(STATUS, StatusEnum.SCHEDULING_DELIVERY);

    // 7. Assign the driver and track the delivery
    var driverId = acquireDriver(ctx, order);
    ctx.set(DRIVER_ID, driverId);
    ctx.set(STATUS, StatusEnum.SCHEDULING_DELIVERY);
    ctx.durablePromise(PICKED_UP_SIGNAL).awaitable().await();
    ctx.set(STATUS, StatusEnum.IN_DELIVERY);
    ctx.durablePromise(DELIVERED_SIGNAL).awaitable().await();
    ctx.set(STATUS, StatusEnum.DELIVERED);
  }

  private String acquireDriver(WorkflowContext ctx, OrderRequest order){
    var driverAwakeable = ctx.awakeable(CoreSerdes.JSON_STRING);
    DriverDeliveryMatcherRestate.newClient(ctx).oneWay()
            .requestDriverForDelivery(getDeliveryCallback(driverAwakeable.id()));

    ctx.set(STATUS, StatusEnum.WAITING_FOR_DRIVER);
    var driverId = driverAwakeable.await();

    var deliveryInfo = getDeliveryInfo(ctx, order.getRestaurantId());
    DriverDigitalTwinRestate.newClient(ctx)
            .assignDeliveryJob(
                    getAssignDeliveryRequest(driverId, ctx.workflowKey(), deliveryInfo)
            ).await();
    return driverId;
  }

  private DeliveryInformation getDeliveryInfo(WorkflowContext ctx, String restaurantId){
    var restaurantLocation = ctx.sideEffect(LOCATION_SERDE, GeoUtils::randomLocation);
    var customerLocation = ctx.sideEffect(LOCATION_SERDE, GeoUtils::randomLocation);
    return new DeliveryInformation(
                    restaurantId,
                    restaurantLocation,
                    customerLocation,
                    false);
  }

  private DeliveryCallback getDeliveryCallback(String driverAwakeableId){
    return DeliveryCallback.newBuilder()
            .setRegion(GeoUtils.DEMO_REGION)
            .setDeliveryCallbackId(driverAwakeableId)
            .build();
  }

  private AssignDeliveryRequest getAssignDeliveryRequest(String driverId, String orderId, DeliveryInformation info){
    return AssignDeliveryRequest.newBuilder()
            .setDriverId(driverId)
            .setOrderId(orderId)
            .setRestaurantId(info.getRestaurantId())
            .setRestaurantLocation(info.getRestaurantLocation().toProto())
            .setCustomerLocation(info.getCustomerLocation().toProto())
            .build();
  }

  // --- Methods invoked by DriverDigitalTwin to update the delivery status

  /**
   * Notifies that the delivery was picked up by the driver.
   */
  @Shared
  public void notifyDeliveryPickup(WorkflowSharedContext ctx) throws TerminalException {
    ctx.durablePromiseHandle(PICKED_UP_SIGNAL).resolve(null);
  }

  /**
   * Notifies that the order was delivered.
   */
  @Shared
  public void notifyDeliveryDelivered(WorkflowSharedContext ctx)
          throws TerminalException {
    ctx.durablePromiseHandle(DELIVERED_SIGNAL).resolve(null);
  }
}
