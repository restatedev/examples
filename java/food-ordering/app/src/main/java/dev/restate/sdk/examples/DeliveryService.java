package dev.restate.sdk.examples;

import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.generated.*;
import dev.restate.sdk.examples.generated.OrderProto.*;
import dev.restate.sdk.examples.types.Location;
import dev.restate.sdk.examples.types.OngoingDelivery;
import dev.restate.sdk.examples.utils.GeoUtils;
import dev.restate.sdk.serde.jackson.JacksonSerdes;

import static dev.restate.sdk.examples.utils.TypeUtils.statusToProto;

public class DeliveryService extends DeliveryServiceRestate.DeliveryServiceRestateImplBase {

    StateKey<OngoingDelivery> DELIVERY_STATE = StateKey.of("state", JacksonSerdes.of(OngoingDelivery.class));

    //
    @Override
    public void start(RestateContext ctx, DeliveryRequest request) throws TerminalException {

        // Temporary placeholder: random location
        var restaurantLocation = ctx.sideEffect(JacksonSerdes.of(Location.class), () -> GeoUtils.randomLocation());
        var customerLocation = ctx.sideEffect(JacksonSerdes.of(Location.class), () -> GeoUtils.randomLocation());

        // Create a new ongoing delivery
        OngoingDelivery delivery = new OngoingDelivery(
            request.getId(),
            request.getCallback(),
            request.getOrder().getRestaurantId(),
            restaurantLocation,
            customerLocation,
            false
        );

        // Store the delivery in Restate's state store
        ctx.set(DELIVERY_STATE, delivery);

        // Acquire a driver
        var driverAwakeable = ctx.awakeable(CoreSerdes.STRING_UTF8);
        DriverPoolServiceRestate.newClient(ctx)
                .requestDriverForDelivery(
                        DeliveryCallback.newBuilder()
                                .setRegion(GeoUtils.DEMO_REGION)
                                .setDeliveryCallbackId(driverAwakeable.id())
                                .build());
        var driverId = driverAwakeable.await();

        // Driver gets the work
        DriverServiceRestate.newClient(ctx)
                .assignDeliveryJob(AssignDeliveryRequest.newBuilder()
                        .setId(driverId)
                        .setRestaurantId(request.getOrder().getRestaurantId())
                        .setRestaurantLocation(restaurantLocation.toProto())
                        .setCustomerLocation(customerLocation.toProto())
                        .build()
                );

        OrderStatusServiceRestate.newClient(ctx).oneWay()
                .setStatus(statusToProto(request.getId(), Status.WAITING_FOR_DRIVER));
    }

    @Override
    public void deliveryPickedUp(RestateContext ctx, DeliveryId request) throws TerminalException {
        var delivery = ctx.get(DELIVERY_STATE).orElseThrow(() ->
                new TerminalException("Delivery was picked up but there is no ongoing delivery.")
        );
        delivery.setOrderPickedUp(true);
        ctx.set(DELIVERY_STATE, delivery);
        OrderStatusServiceRestate.newClient(ctx).oneWay()
                .setStatus(statusToProto(delivery.getOrderId(), Status.IN_DELIVERY));
    }

    @Override
    public void deliveryDelivered(RestateContext ctx, DeliveryId request) throws TerminalException {
        var delivery = ctx.get(DELIVERY_STATE).orElseThrow(() ->
                new TerminalException("Delivery was delivered but there is no ongoing delivery.")
        );
        ctx.clear(DELIVERY_STATE);
        ctx.awakeableHandle(delivery.getCallbackId()).resolve(CoreSerdes.VOID, null);
    }

    @Override
    public void driverLocationUpdate(RestateContext ctx, DeliveryLocationUpdate request) throws TerminalException {
        var delivery = ctx.get(DELIVERY_STATE).orElseThrow(() ->
                new TerminalException("Driver is doing a delivery but there is no ongoing delivery.")
        );

        var location = Location.fromProto(request.getLocation());
        var eta = delivery.isOrderPickedUp() ?
                GeoUtils.calculateEtaMillis(location, delivery.getCustomerLocation()) :
                GeoUtils.calculateEtaMillis(location, delivery.getRestaurantLocation()) +
                        GeoUtils.calculateEtaMillis(delivery.getRestaurantLocation(), delivery.getCustomerLocation());

        OrderStatusServiceRestate.newClient(ctx).oneWay().setETA(
                OrderProto.OrderStatus.newBuilder().setId(delivery.getOrderId()).setEta(eta).build()
        );
    }
}
