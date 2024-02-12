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
import examples.order.generated.OrderProto;
import examples.order.generated.OrderStatusServiceRestate;
import examples.order.types.DeliveryInformation;
import examples.order.types.Location;
import examples.order.types.OrderRequest;
import examples.order.types.StatusEnum;
import examples.order.utils.GeoUtils;
import examples.order.generated.DriverDeliveryMatcherRestate;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.sdk.workflow.DurablePromiseKey;
import dev.restate.sdk.workflow.WorkflowContext;
import dev.restate.sdk.workflow.WorkflowSharedContext;

import java.time.Duration;
import java.util.UUID;

/**
 * Order processing workflow Gets called for each Kafka event that is published to the order topic.
 * The event contains the order ID and the raw JSON order. The workflow handles the payment, asks
 * the restaurant to start the preparation, and triggers the delivery.
 */
@Service(ServiceType.WORKFLOW)
public class OrderWorkflow {

  public final static StateKey<StatusEnum> STATUS = StateKey.of("status", JacksonSerdes.of(StatusEnum.class));
  private static final StateKey<DeliveryInformation> DELIVERY_INFO = StateKey.of("delivery-info", JacksonSerdes.of(DeliveryInformation.class));

  private static final Serde<Location> LOCATION_SERDE = JacksonSerdes.of(Location.class);

  private static final DurablePromiseKey<Void> PICKED_UP_SIGNAL = DurablePromiseKey.of("delivery-picked-up", CoreSerdes.VOID);
  private static final DurablePromiseKey<Void> DELIVERED_SIGNAL = DurablePromiseKey.of("delivery-delivered", CoreSerdes.VOID);

  private final RestaurantClient restaurant = RestaurantClient.get();
  private final PaymentClient paymentClnt = PaymentClient.get();

  @Workflow
  public void run(WorkflowContext ctx, OrderRequest order)
      throws TerminalException {
    String orderId = ctx.workflowKey();

    // 1. Set status
    ctx.set(STATUS, StatusEnum.CREATED);

    // 2. Handle payment
    String token = ctx.sideEffect(CoreSerdes.JSON_STRING, () -> UUID.randomUUID().toString());
    boolean paid =
        ctx.sideEffect(
            CoreSerdes.JSON_BOOLEAN, () -> paymentClnt.charge(orderId, token, order.getTotalCost()));

    if (!paid) {
      ctx.set(STATUS, StatusEnum.REJECTED);
      return;
    }

    // 3. Schedule preparation
    ctx.set(STATUS, StatusEnum.SCHEDULED);
    ctx.sleep(Duration.ofMillis(order.getDeliveryDelay()));

    // 4. Trigger preparation
    var preparationAwakeable = ctx.awakeable(CoreSerdes.VOID);
    ctx.sideEffect(() -> restaurant.prepare(orderId, preparationAwakeable.id()));
    ctx.set(STATUS, StatusEnum.IN_PREPARATION);

    preparationAwakeable.await();
    ctx.set(STATUS, StatusEnum.SCHEDULING_DELIVERY);

    var restaurantLocation = ctx.sideEffect(LOCATION_SERDE, GeoUtils::randomLocation);
    var customerLocation = ctx.sideEffect(LOCATION_SERDE, GeoUtils::randomLocation);

    // 5. Store the delivery information in Restate's state store, the UI can query this
    DeliveryInformation deliveryInfo =
            new DeliveryInformation(
                    order.getRestaurantId(),
                    restaurantLocation,
                    customerLocation,
                    false);
    ctx.set(DELIVERY_INFO, deliveryInfo);

    // 6. Acquire a driver
    var driverAwakeable = ctx.awakeable(CoreSerdes.JSON_STRING);
    DriverDeliveryMatcherRestate.newClient(ctx)
            .oneWay()
            .requestDriverForDelivery(
                    OrderProto.DeliveryCallback.newBuilder()
                            .setRegion(GeoUtils.DEMO_REGION)
                            .setDeliveryCallbackId(driverAwakeable.id())
                            .build());
    ctx.set(STATUS, StatusEnum.WAITING_FOR_DRIVER);
    // Wait until the driver pool service has located a driver
    // This awakeable gets resolved either immediately when there is a pending delivery
    // or later, when a new delivery comes in.
    var driverId = driverAwakeable.await();

    // 7. Assign the driver to the job, the driver will notify back the workflow by using the other methods
    DriverDigitalTwinRestate.newClient(ctx)
            .assignDeliveryJob(
                    OrderProto.AssignDeliveryRequest.newBuilder()
                            .setDriverId(driverId)
                            .setOrderId(orderId)
                            .setRestaurantId(order.getRestaurantId())
                            .setRestaurantLocation(restaurantLocation.toProto())
                            .setCustomerLocation(customerLocation.toProto())
                            .build())
            .await();
    ctx.set(STATUS, StatusEnum.SCHEDULING_DELIVERY);

    // 8. Wait for the delivery to be picked up by the driver
    ctx.durablePromise(PICKED_UP_SIGNAL).awaitable().await();
    ctx.set(STATUS, StatusEnum.IN_DELIVERY);

    // 9. Wait for the delivery to be completed
    ctx.durablePromise(DELIVERED_SIGNAL).awaitable().await();

    // 10. Delivered, enjoy the food!
    ctx.set(STATUS, StatusEnum.DELIVERED);
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

  /**
   * Updates the location of the order.
   */
  @Shared
  public void handleDriverLocationUpdate(WorkflowSharedContext ctx, Location location)
          throws TerminalException {
    // Retrieve the delivery information for this delivery
    var delivery =
            ctx.get(DELIVERY_INFO)
                    .orElseThrow(
                            () ->
                                    new TerminalException(
                                            "We expect the order already has a delivery registered."));

    // Parse the new location, and calculate the ETA of the delivery to the customer
    var eta =
            delivery.isOrderPickedUp()
                    ? GeoUtils.calculateEtaMillis(location, delivery.getCustomerLocation())
                    : GeoUtils.calculateEtaMillis(location, delivery.getRestaurantLocation())
                    + GeoUtils.calculateEtaMillis(delivery.getRestaurantLocation(), delivery.getCustomerLocation());

    // Update the ETA of the order
    OrderStatusServiceRestate.newClient(ctx)
            .oneWay()
            .setETA(OrderProto.NewOrderETA.newBuilder().setOrderId(ctx.workflowKey()).setEta(eta).build());
  }
}
