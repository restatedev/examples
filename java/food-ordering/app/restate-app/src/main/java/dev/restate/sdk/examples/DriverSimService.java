package dev.restate.sdk.examples;

import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.clients.KafkaPublisher;
import dev.restate.sdk.examples.generated.DriverServiceRestate;
import dev.restate.sdk.examples.generated.DriverSimServiceRestate;
import dev.restate.sdk.examples.generated.OrderProto;
import dev.restate.sdk.examples.types.AssignedDelivery;
import dev.restate.sdk.examples.types.DeliveryStatus;
import dev.restate.sdk.examples.types.Location;
import dev.restate.sdk.examples.utils.GeoUtils;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.time.Duration;


/**
 * Simulated driver
 * This is not really part of the food ordering application.
 * This would actually be a mobile app that drivers use to accept delivery requests,
 * and to put themselves available.
 *
 * For simplicity, we implemented this with Restate.
 */
public class DriverSimService extends DriverSimServiceRestate.DriverSimServiceRestateImplBase {
    private static final Logger logger = LogManager.getLogger(DriverSimService.class);

    KafkaPublisher producer = new KafkaPublisher();

    private final long POLL_INTERVAL = 1000;
    private final long MOVE_INTERVAL = 1000;
    private final long PAUSE_BETWEEN_DELIVERIES = 2000;


    StateKey<Location> CURRENT_LOCATION = StateKey.of("location", JacksonSerdes.of(Location.class));

    StateKey<DeliveryStatus> DELIVERY_STATUS = StateKey.of("delivery-status", JacksonSerdes.of(DeliveryStatus.class));

    /**
     *
     */
    @Override
    public void startDriver(RestateContext ctx, OrderProto.DriverId request) throws TerminalException {
        // If this driver was already created, do nothing
        if(ctx.get(CURRENT_LOCATION).isPresent()){
            return;
        }

        logger.info("Starting driver " + request.getDriverId());
        var location = ctx.sideEffect(JacksonSerdes.of(Location.class), GeoUtils::randomLocation);
        ctx.set(CURRENT_LOCATION, location);
        producer.sendUpdate(request.getDriverId(), JacksonSerdes.of(Location.class).serialize(location));

        // Tell the digital twin of the driver in the food ordering app, that he is available
        DriverServiceRestate.newClient(ctx).setDriverAvailable(
                OrderProto.DriverAvailableNotification.newBuilder().setDriverId(request.getDriverId()).setRegion(GeoUtils.DEMO_REGION).build()
        ).await();

        // Start polling for work
        DriverSimServiceRestate.newClient(ctx).oneWay().pollForWork(request);
    }

    /**
     * Asks the food ordering app to get a new delivery job.
     * If there is no job, the driver will ask again after a short delay.
     */
    @Override
    public void pollForWork(RestateContext ctx, OrderProto.DriverId request) throws TerminalException {
        var driverSimClnt = DriverSimServiceRestate.newClient(ctx);

        // Ask the digital twin of the driver in the food ordering app, if he already got a job assigned
        var newDeliveryJob = DriverServiceRestate.newClient(ctx).getAssignedDelivery(request).await();
        if(newDeliveryJob.getOrderId().isEmpty()){
            System.out.println("No delivery job yet");
            driverSimClnt.delayed(Duration.ofMillis(POLL_INTERVAL)).pollForWork(request);
            return;
        }

        // If there is a job, start the delivery
        var newAssignedDelivery = new AssignedDelivery(
                newDeliveryJob.getDriverId(),
                newDeliveryJob.getOrderId(),
                newDeliveryJob.getRestaurantId(),
                Location.fromProto(newDeliveryJob.getRestaurantLocation()),
                Location.fromProto(newDeliveryJob.getCustomerLocation()));
        ctx.set(DELIVERY_STATUS, new DeliveryStatus(newAssignedDelivery, false));

        // Start moving to the delivery pickup location
        driverSimClnt.delayed(Duration.ofMillis(MOVE_INTERVAL)).move(request);
    }

    @Override
    public void move(RestateContext ctx, OrderProto.DriverId request) throws TerminalException {
        var thisDriverSim = DriverSimServiceRestate.newClient(ctx);
        var deliveryStatus = ctx.get(DELIVERY_STATUS).orElseThrow(() -> new TerminalException("Driver has no delivery assigned"));
        var currentLocation = ctx.get(CURRENT_LOCATION).orElseThrow(() -> new TerminalException("Driver has no location assigned"));

        // Get next destination to go to
        var nextDestination = deliveryStatus.pickedUp ? deliveryStatus.delivery.customerLocation : deliveryStatus.delivery.restaurantLocation;

        // Move to the next location
        var newLocation = GeoUtils.moveToDestination(currentLocation, nextDestination);
        ctx.set(CURRENT_LOCATION, newLocation);
        producer.sendUpdate(request.getDriverId(), JacksonSerdes.of(Location.class).serialize(newLocation));

        // If we reached the destination, notify the food ordering app
        if(newLocation.equals(nextDestination)){
            // If the delivery was already picked up, then that means it now arrived at the customer
            if(deliveryStatus.pickedUp){
                // Delivery is delivered to customer
                ctx.clear(DELIVERY_STATUS);

                // Notify the driver's digital twin in the food ordering app of the delivery success
                DriverServiceRestate.newClient(ctx).notifyDeliveryDelivered(request).await();

                // Take a small break before starting the next delivery
                ctx.sleep(Duration.ofMillis(PAUSE_BETWEEN_DELIVERIES));

                // Tell the driver's digital twin in the food ordering app, that he is available
                DriverServiceRestate.newClient(ctx).oneWay().setDriverAvailable(
                        OrderProto.DriverAvailableNotification.newBuilder().setDriverId(request.getDriverId()).setRegion(GeoUtils.DEMO_REGION).build()
                );

                // Start polling for work
                DriverSimServiceRestate.newClient(ctx).oneWay().pollForWork(request);
                return;
            }

            // If the delivery was not picked up yet, then that means the driver now arrived at the restaurant
            // and will start the delivery
            deliveryStatus.pickedUp = true;
            ctx.set(DELIVERY_STATUS, deliveryStatus);
            DriverServiceRestate.newClient(ctx).notifyDeliveryPickup(request).await();
        }

        // Call this method again after a short delay
        thisDriverSim.delayed(Duration.ofMillis(MOVE_INTERVAL)).move(request);
    }
}

