package dev.restate.sdk.examples;

import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.generated.*;
import dev.restate.sdk.examples.generated.OrderProto.*;
import dev.restate.sdk.examples.types.DriverStatus;
import dev.restate.sdk.serde.jackson.JacksonSerdes;

/**
 * Digital twin for the driver
 */
public class DriverService extends DriverServiceRestate.DriverServiceRestateImplBase {

    StateKey<DriverStatus> DRIVER_STATUS = StateKey.of("driver-status", JacksonSerdes.of(DriverStatus.class));

    StateKey<AssignDeliveryRequest> CURRENT_DELIVERY_STATE = StateKey.of("delivery-status", JacksonSerdes.of(AssignDeliveryRequest.class));

    StateKey<Location> CURRENT_LOCATION = StateKey.of("location-status", JacksonSerdes.of(Location.class));


    @Override
    public void setDriverAvailable(RestateContext ctx, DriverAvailableNotification request) throws TerminalException {
        expectStatus(ctx, DriverStatus.IDLE);

        ctx.set(DRIVER_STATUS, DriverStatus.WAITING_FOR_WORK);
        DriverPoolServiceRestate.newClient(ctx)
                .oneWay()
                .setDriverAvailable(
                        DriverAvailableNotification.newBuilder()
                                .setRegion(request.getRegion())
                                .setId(request.getId())
                                .build()
                );
    }

    @Override
    public void notifyDeliveryPickup(RestateContext ctx, DriverId request) throws TerminalException {
        expectStatus(ctx, DriverStatus.DELIVERING);

        // Retrieve the ongoing delivery
        var currentDelivery = ctx.get(CURRENT_DELIVERY_STATE).orElseThrow(() ->
                new TerminalException("Driver is in status DELIVERING but there is no current delivery set.")
        );

        // Update the status of the delivery in the delivery service
        DeliveryServiceRestate.newClient(ctx)
                .oneWay()
                .deliveryPickedUp(DeliveryId.newBuilder().setId(currentDelivery.getId()).build());
    }

    @Override
    public void notifyDeliveryDelivered(RestateContext ctx, DriverId request) throws TerminalException {
        expectStatus(ctx, DriverStatus.DELIVERING);

        var currentDelivery = ctx.get(CURRENT_DELIVERY_STATE).orElseThrow(() ->
                new TerminalException("Driver is in status DELIVERING but there is no current delivery set.")
        );

        ctx.clear(CURRENT_DELIVERY_STATE);
        DeliveryServiceRestate.newClient(ctx).oneWay()
                .deliveryDelivered(DeliveryId.newBuilder().setId(currentDelivery.getId()).build());
        ctx.set(DRIVER_STATUS, DriverStatus.IDLE);
    }

    @Override
    public void assignDeliveryJob(RestateContext ctx, AssignDeliveryRequest request) throws TerminalException {
        expectStatus(ctx, DriverStatus.WAITING_FOR_WORK);

        ctx.set(DRIVER_STATUS, DriverStatus.DELIVERING);
        ctx.set(CURRENT_DELIVERY_STATE, request);

        ctx.get(CURRENT_LOCATION).ifPresent(loc ->
                DeliveryServiceRestate.newClient(ctx).oneWay().driverLocationUpdate(
                        DeliveryLocationUpdate.newBuilder()
                                .setId(request.getId())
                                .setLocation(loc)
                                .build()
                ));
    }

    @Override
    public void updateCoordinate(RestateContext ctx, OrderProto.KafkaBytesEvent request) throws TerminalException {
        // Update the location of the driver
        Location location = JacksonSerdes.of(Location.class).deserialize(request.getPayload());
        ctx.set(CURRENT_LOCATION, location);

        // Update the location of the delivery, if there is one
        ctx.get(CURRENT_DELIVERY_STATE)
                .ifPresent(delivery ->
                        DeliveryServiceRestate.newClient(ctx).oneWay()
                                .driverLocationUpdate(
                                        DeliveryLocationUpdate.newBuilder()
                                                .setId(delivery.getId())
                                                .setLocation(location)
                                                .build()
                                ));
    }

    @Override
    public AssignDeliveryRequest getAssignedDelivery(RestateContext ctx, DriverId request) throws TerminalException {
        return ctx.get(CURRENT_DELIVERY_STATE).orElse(AssignDeliveryRequest.getDefaultInstance());
    }

    // Utility function to check if the driver is in the expected state
    // If the driver is in a different state, a terminal exception is thrown that stops any retries from taking place.
    // Is only called from inside the driver service
    private void expectStatus(RestateContext ctx, DriverStatus expectedStatus) {
        var currentStatus = ctx.get(DRIVER_STATUS).orElse(DriverStatus.IDLE);

        if (currentStatus != expectedStatus) {
            throw new TerminalException(String.format("Driver status wrong. Expected %s but was %s",
                    expectedStatus.toString(), currentStatus.toString()));
        }
    }
}

