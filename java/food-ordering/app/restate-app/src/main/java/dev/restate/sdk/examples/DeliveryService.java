package dev.restate.sdk.examples;

import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.generated.*;
import dev.restate.sdk.examples.types.Location;
import dev.restate.sdk.examples.types.DeliveryInformation;
import dev.restate.sdk.examples.types.Status;
import dev.restate.sdk.examples.utils.GeoUtils;
import dev.restate.sdk.serde.jackson.JacksonSerdes;

import static dev.restate.sdk.examples.utils.TypeUtils.statusToProto;

public class DeliveryService extends DeliveryServiceRestate.DeliveryServiceRestateImplBase {

    StateKey<DeliveryInformation> DELIVERY_INFO = StateKey.of("delivery-info", JacksonSerdes.of(DeliveryInformation.class));

    //
    @Override
    public void start(RestateContext ctx, OrderProto.DeliveryRequest request) throws TerminalException {

        // Temporary placeholder: random location
        var restaurantLocation = ctx.sideEffect(JacksonSerdes.of(Location.class), () -> GeoUtils.randomLocation());
        var customerLocation = ctx.sideEffect(JacksonSerdes.of(Location.class), () -> GeoUtils.randomLocation());

        // Create a new ongoing delivery
        DeliveryInformation deliveryInfo = new DeliveryInformation(
            request.getOrderId(),
            request.getCallback(),
            request.getOrder().getRestaurantId(),
            restaurantLocation,
            customerLocation,
            false
        );

        // Store the delivery in Restate's state store
        ctx.set(DELIVERY_INFO, deliveryInfo);

        // Acquire a driver
        var driverAwakeable = ctx.awakeable(CoreSerdes.STRING_UTF8);
        DriverPoolServiceRestate.newClient(ctx)
                .requestDriverForDelivery(
                        OrderProto.DeliveryCallback.newBuilder()
                                .setRegion(GeoUtils.DEMO_REGION)
                                .setDeliveryCallbackId(driverAwakeable.id())
                                .build());
        var driverId = driverAwakeable.await();

        // Driver gets the work
        DriverServiceRestate.newClient(ctx)
                .assignDeliveryJob(OrderProto.AssignDeliveryRequest.newBuilder()
                        .setDriverId(driverId)
                        .setOrderId(request.getOrderId())
                        .setRestaurantId(request.getOrder().getRestaurantId())
                        .setRestaurantLocation(restaurantLocation.toProto())
                        .setCustomerLocation(customerLocation.toProto())
                        .build()
                ).await();

        OrderStatusServiceRestate.newClient(ctx).oneWay()
                .setStatus(statusToProto(request.getOrderId(), Status.WAITING_FOR_DRIVER));
    }

    @Override
    public void deliveryPickedUp(RestateContext ctx, OrderProto.OrderId request) throws TerminalException {
        var delivery = ctx.get(DELIVERY_INFO).orElseThrow(() ->
                new TerminalException("Delivery was picked up but there is no ongoing delivery.")
        );
        delivery.setOrderPickedUp(true);
        ctx.set(DELIVERY_INFO, delivery);
        OrderStatusServiceRestate.newClient(ctx).oneWay()
                .setStatus(statusToProto(delivery.getOrderId(), Status.IN_DELIVERY));
    }

    @Override
    public void deliveryDelivered(RestateContext ctx, OrderProto.OrderId request) throws TerminalException {
        var delivery = ctx.get(DELIVERY_INFO).orElseThrow(() ->
                new TerminalException("Delivery was delivered but there is no ongoing delivery.")
        );
        ctx.clear(DELIVERY_INFO);
        ctx.awakeableHandle(delivery.getCallbackId()).resolve(CoreSerdes.VOID, null);
    }

    @Override
    public void driverLocationUpdate(RestateContext ctx, OrderProto.DeliveryLocationUpdate request) throws TerminalException {
        var delivery = ctx.get(DELIVERY_INFO).orElseThrow(() ->
                new TerminalException("Driver is doing a delivery but there is no ongoing delivery.")
        );

        var location = Location.fromProto(request.getLocation());
        var eta = delivery.isOrderPickedUp() ?
                GeoUtils.calculateEtaMillis(location, delivery.getCustomerLocation()) :
                GeoUtils.calculateEtaMillis(location, delivery.getRestaurantLocation()) +
                        GeoUtils.calculateEtaMillis(delivery.getRestaurantLocation(), delivery.getCustomerLocation());

        OrderStatusServiceRestate.newClient(ctx).oneWay().setETA(
                OrderProto.OrderStatus.newBuilder().setOrderId(delivery.getOrderId()).setEta(eta).build()
        );
    }
}
