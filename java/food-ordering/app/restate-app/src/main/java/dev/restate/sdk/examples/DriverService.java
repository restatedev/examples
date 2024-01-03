package dev.restate.sdk.examples;

import com.google.protobuf.Empty;
import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.generated.DeliveryServiceRestate;
import dev.restate.sdk.examples.generated.DriverPoolServiceRestate;
import dev.restate.sdk.examples.generated.DriverServiceRestate;
import dev.restate.sdk.examples.generated.OrderProto;
import dev.restate.sdk.examples.generated.OrderProto.AssignDeliveryRequest;
import dev.restate.sdk.examples.types.AssignedDelivery;
import dev.restate.sdk.examples.types.DriverStatus;
import dev.restate.sdk.examples.types.Location;
import dev.restate.sdk.serde.jackson.JacksonSerdes;

/** Digital twin for the driver */
public class DriverService extends DriverServiceRestate.DriverServiceRestateImplBase {

  StateKey<DriverStatus> DRIVER_STATUS =
      StateKey.of("driver-status", JacksonSerdes.of(DriverStatus.class));
  StateKey<AssignedDelivery> ASSIGNED_DELIVERY =
      StateKey.of("assigned-delivery", JacksonSerdes.of(AssignedDelivery.class));
  StateKey<Location> DRIVER_LOCATION =
      StateKey.of("driver-location", JacksonSerdes.of(Location.class));

  @Override
  public void setDriverAvailable(RestateContext ctx, OrderProto.DriverAvailableNotification request)
      throws TerminalException {
    expectStatus(ctx, DriverStatus.IDLE);

    ctx.set(DRIVER_STATUS, DriverStatus.WAITING_FOR_WORK);
    DriverPoolServiceRestate.newClient(ctx)
        .oneWay()
        .setDriverAvailable(
            OrderProto.DriverPoolAvailableNotification.newBuilder()
                .setRegion(request.getRegion())
                .setDriverId(request.getDriverId())
                .build());
  }

  @Override
  public void notifyDeliveryPickup(RestateContext ctx, OrderProto.DriverId request)
      throws TerminalException {
    expectStatus(ctx, DriverStatus.DELIVERING);

    // Retrieve the ongoing delivery
    var currentDelivery =
        ctx.get(ASSIGNED_DELIVERY)
            .orElseThrow(
                () ->
                    new TerminalException(
                        "Driver is in status DELIVERING but there is no current delivery set."));
    currentDelivery.notifyPickup();
    ctx.set(ASSIGNED_DELIVERY, currentDelivery);

    // Update the status of the delivery in the delivery service
    DeliveryServiceRestate.newClient(ctx)
        .oneWay()
        .deliveryPickedUp(
            OrderProto.OrderId.newBuilder().setOrderId(currentDelivery.orderId).build());
  }

  @Override
  public void notifyDeliveryDelivered(RestateContext ctx, OrderProto.DriverId request)
      throws TerminalException {
    expectStatus(ctx, DriverStatus.DELIVERING);

    var assignedDelivery =
        ctx.get(ASSIGNED_DELIVERY)
            .orElseThrow(
                () ->
                    new TerminalException(
                        "Driver is in status DELIVERING but there is no current delivery set."));

    ctx.clear(ASSIGNED_DELIVERY);
    DeliveryServiceRestate.newClient(ctx)
        .oneWay()
        .deliveryDelivered(
            OrderProto.OrderId.newBuilder().setOrderId(assignedDelivery.orderId).build());
    ctx.set(DRIVER_STATUS, DriverStatus.IDLE);
  }

  @Override
  public void assignDeliveryJob(RestateContext ctx, AssignDeliveryRequest request)
      throws TerminalException {
    expectStatus(ctx, DriverStatus.WAITING_FOR_WORK);

    ctx.set(DRIVER_STATUS, DriverStatus.DELIVERING);
    ctx.set(
        ASSIGNED_DELIVERY,
        new AssignedDelivery(
            request.getDriverId(),
            request.getOrderId(),
            request.getRestaurantId(),
            Location.fromProto(request.getRestaurantLocation()),
            Location.fromProto(request.getCustomerLocation())));

    ctx.get(DRIVER_LOCATION)
        .ifPresent(
            loc ->
                DeliveryServiceRestate.newClient(ctx)
                    .oneWay()
                    .driverLocationUpdate(
                        OrderProto.DeliveryLocationUpdate.newBuilder()
                            .setOrderId(request.getOrderId())
                            .setLocation(loc.toProto())
                            .build()));
  }

  @Override
  public void updateCoordinate(RestateContext ctx, OrderProto.KafkaDriverEvent request)
      throws TerminalException {
    // Update the location of the driver
    Location location = JacksonSerdes.of(Location.class).deserialize(request.getPayload());
    ctx.set(DRIVER_LOCATION, location);

    // Update the location of the delivery, if there is one
    ctx.get(ASSIGNED_DELIVERY)
        .ifPresent(
            delivery ->
                DeliveryServiceRestate.newClient(ctx)
                    .oneWay()
                    .driverLocationUpdate(
                        OrderProto.DeliveryLocationUpdate.newBuilder()
                            .setOrderId(delivery.orderId)
                            .setLocation(location.toProto())
                            .build()));
  }

  @Override
  public OrderProto.AssignedDeliveryResponse getAssignedDelivery(
      RestateContext ctx, OrderProto.DriverId request) throws TerminalException {
    var assignedDelivery = ctx.get(ASSIGNED_DELIVERY);

    return assignedDelivery
        .map(
            delivery ->
                OrderProto.AssignedDeliveryResponse.newBuilder()
                    .setDelivery(
                        OrderProto.Delivery.newBuilder()
                            .setDriverId(delivery.driverId)
                            .setOrderId(delivery.orderId)
                            .setRestaurantId(delivery.restaurantId)
                            .setCustomerLocation(delivery.customerLocation.toProto())
                            .setRestaurantLocation(delivery.restaurantLocation.toProto())
                            .build())
                    .build())
        .orElse(
            OrderProto.AssignedDeliveryResponse.newBuilder()
                .setEmpty(Empty.getDefaultInstance())
                .build());
  }

  // Utility function to check if the driver is in the expected state
  // If the driver is in a different state, a terminal exception is thrown that stops any retries
  // from taking place.
  // Is only called from inside the driver service
  private void expectStatus(RestateContext ctx, DriverStatus expectedStatus) {
    var currentStatus = ctx.get(DRIVER_STATUS).orElse(DriverStatus.IDLE);

    if (currentStatus != expectedStatus) {
      throw new TerminalException(
          String.format(
              "Driver status wrong. Expected %s but was %s",
              expectedStatus.toString(), currentStatus));
    }
  }
}
