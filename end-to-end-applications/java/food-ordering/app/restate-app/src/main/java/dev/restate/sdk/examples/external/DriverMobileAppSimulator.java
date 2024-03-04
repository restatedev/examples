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

package dev.restate.sdk.examples.external;

import static dev.restate.sdk.examples.generated.OrderProto.*;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.clients.KafkaPublisher;
import dev.restate.sdk.examples.generated.DriverDigitalTwinRestate;
import dev.restate.sdk.examples.generated.DriverMobileAppSimulatorRestate;
import dev.restate.sdk.examples.types.AssignedDelivery;
import dev.restate.sdk.examples.types.Location;
import dev.restate.sdk.examples.utils.GeoUtils;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import java.time.Duration;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * !!!SHOULD BE AN EXTERNAL APP ON THE DRIVER's PHONE!!! Simulated driver with application that
 * interacts with the food ordering app. This is not really part of the food ordering application.
 * This would actually be a mobile app that drivers use to accept delivery requests, and to set
 * themselves as available.
 *
 * <p>For simplicity, we implemented this with Restate.
 */
public class DriverMobileAppSimulator
    extends DriverMobileAppSimulatorRestate.DriverMobileAppSimulatorRestateImplBase {
  private static final Logger logger = LogManager.getLogger(DriverMobileAppSimulator.class);

  private final KafkaPublisher producer = new KafkaPublisher();

  private static final long POLL_INTERVAL = 1000;
  private static final long MOVE_INTERVAL = 1000;
  private static final long PAUSE_BETWEEN_DELIVERIES = 2000;

  private final StateKey<Location> CURRENT_LOCATION =
      StateKey.of("current-location", JacksonSerdes.of(Location.class));

  private final StateKey<AssignedDelivery> ASSIGNED_DELIVERY =
      StateKey.of("assigned-delivery", JacksonSerdes.of(AssignedDelivery.class));

  /** Mimics the driver setting himself to available in the app */
  @Override
  public void startDriver(ObjectContext ctx, DriverId request) throws TerminalException {
    // If this driver was already created, do nothing
    if (ctx.get(CURRENT_LOCATION).isPresent()) {
      return;
    }

    logger.info("Starting driver " + request.getDriverId());
    var location = ctx.sideEffect(JacksonSerdes.of(Location.class), GeoUtils::randomLocation);
    ctx.set(CURRENT_LOCATION, location);
    producer.sendDriverUpdate(
        request.getDriverId(), JacksonSerdes.of(Location.class).serialize(location));

    // Tell the digital twin of the driver in the food ordering app, that he is available
    DriverDigitalTwinRestate.newClient(ctx)
        .setDriverAvailable(
            DriverAvailableNotification.newBuilder()
                .setDriverId(request.getDriverId())
                .setRegion(GeoUtils.DEMO_REGION)
                .build())
        .await();

    // Start polling for work
    DriverMobileAppSimulatorRestate.newClient(ctx).oneWay().pollForWork(request);
  }

  /**
   * Asks the food ordering app to get a new delivery job. If there is no job, the driver will ask
   * again after a short delay.
   */
  @Override
  public void pollForWork(ObjectContext ctx, DriverId request) throws TerminalException {
    var thisDriverSim = DriverMobileAppSimulatorRestate.newClient(ctx);

    // Ask the digital twin of the driver in the food ordering app, if he already got a job assigned
    var optionalAssignedDelivery =
        DriverDigitalTwinRestate.newClient(ctx).getAssignedDelivery(request).await();

    // If there is no job, ask again after a short delay
    if (optionalAssignedDelivery.hasEmpty()) {
      thisDriverSim.delayed(Duration.ofMillis(POLL_INTERVAL)).pollForWork(request);
      return;
    }

    // If there is a job, start the delivery
    var delivery = optionalAssignedDelivery.getDelivery();
    var newAssignedDelivery =
        new AssignedDelivery(
            delivery.getDriverId(),
            delivery.getOrderId(),
            delivery.getRestaurantId(),
            Location.fromProto(delivery.getRestaurantLocation()),
            Location.fromProto(delivery.getCustomerLocation()));
    ctx.set(ASSIGNED_DELIVERY, newAssignedDelivery);

    // Start moving to the delivery pickup location
    thisDriverSim.delayed(Duration.ofMillis(MOVE_INTERVAL)).move(request);
  }

  /** Periodically lets the food ordering app know the new location */
  @Override
  public void move(ObjectContext ctx, DriverId request) throws TerminalException {
    var thisDriverSim = DriverMobileAppSimulatorRestate.newClient(ctx);
    var assignedDelivery =
        ctx.get(ASSIGNED_DELIVERY)
            .orElseThrow(() -> new TerminalException("Driver has no delivery assigned"));
    var currentLocation =
        ctx.get(CURRENT_LOCATION)
            .orElseThrow(() -> new TerminalException("Driver has no location assigned"));

    // Get next destination to go to
    var nextDestination =
        assignedDelivery.isOrderPickedUp()
            ? assignedDelivery.getCustomerLocation()
            : assignedDelivery.getRestaurantLocation();

    // Move to the next location
    var newLocation = GeoUtils.moveToDestination(currentLocation, nextDestination);
    ctx.set(CURRENT_LOCATION, newLocation);
    producer.sendDriverUpdate(
        request.getDriverId(), JacksonSerdes.of(Location.class).serialize(newLocation));

    // If we reached the destination, notify the food ordering app
    if (newLocation.equals(nextDestination)) {
      // If the delivery was already picked up, then that means it now arrived at the customer
      if (assignedDelivery.isOrderPickedUp()) {
        // Delivery is delivered to customer
        ctx.clear(ASSIGNED_DELIVERY);

        // Notify the driver's digital twin in the food ordering app of the delivery success
        DriverDigitalTwinRestate.newClient(ctx).notifyDeliveryDelivered(request).await();

        // Take a small break before starting the next delivery
        ctx.sleep(Duration.ofMillis(PAUSE_BETWEEN_DELIVERIES));

        // Tell the driver's digital twin in the food ordering app, that he is available
        DriverDigitalTwinRestate.newClient(ctx)
            .oneWay()
            .setDriverAvailable(
                DriverAvailableNotification.newBuilder()
                    .setDriverId(request.getDriverId())
                    .setRegion(GeoUtils.DEMO_REGION)
                    .build());

        // Start polling for work
        DriverMobileAppSimulatorRestate.newClient(ctx).oneWay().pollForWork(request);
        return;
      }

      // If the delivery was not picked up yet, then that means the driver now arrived at the
      // restaurant
      // and will start the delivery
      assignedDelivery.notifyPickup();
      ctx.set(ASSIGNED_DELIVERY, assignedDelivery);
      DriverDigitalTwinRestate.newClient(ctx).notifyDeliveryPickup(request).await();
    }

    // Call this method again after a short delay
    thisDriverSim.delayed(Duration.ofMillis(MOVE_INTERVAL)).move(request);
  }
}
