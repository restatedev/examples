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

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.examples.*;
import dev.restate.sdk.examples.clients.KafkaPublisher;
import dev.restate.sdk.examples.types.AssignedDelivery;
import dev.restate.sdk.examples.types.Location;
import dev.restate.sdk.examples.utils.GeoUtils;
import java.time.Duration;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.serde.jackson.JacksonSerdes;
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
@VirtualObject
public class DriverMobileAppSimulator {
  private static final Logger logger = LogManager.getLogger(DriverMobileAppSimulator.class);

  private final KafkaPublisher producer = new KafkaPublisher();

  private static final long POLL_INTERVAL = 1000;
  private static final long MOVE_INTERVAL = 1000;
  private static final long PAUSE_BETWEEN_DELIVERIES = 2000;

  private final StateKey<Location> CURRENT_LOCATION =
      StateKey.of("current-location", Location.class);

  private final StateKey<AssignedDelivery> ASSIGNED_DELIVERY =
      StateKey.of("assigned-delivery", AssignedDelivery.class);

  /** Mimics the driver setting himself to available in the app */
  @Handler
  public void startDriver(ObjectContext ctx) throws TerminalException {
    // If this driver was already created, do nothing
    if (ctx.get(CURRENT_LOCATION).isPresent()) {
      return;
    }

    logger.info("Starting driver " + ctx.key());
    var location = ctx.run(Location.class, GeoUtils::randomLocation);
    ctx.set(CURRENT_LOCATION, location);
    producer.sendDriverUpdate(ctx.key(), JacksonSerdes.of(Location.class).serialize(location).toByteArray());

    // Tell the digital twin of the driver in the food ordering app, that he is available
    DriverDigitalTwinClient.fromContext(ctx, ctx.key())
        .setDriverAvailable(GeoUtils.DEMO_REGION)
        .await();

    // Start polling for work
    DriverMobileAppSimulatorClient.fromContext(ctx, ctx.key()).send().pollForWork();
  }

  /**
   * Asks the food ordering app to get a new delivery job. If there is no job, the driver will ask
   * again after a short delay.
   */
  @Handler
  public void pollForWork(ObjectContext ctx) throws TerminalException {
    var thisDriverSim = DriverMobileAppSimulatorClient.fromContext(ctx, ctx.key());

    // Ask the digital twin of the driver in the food ordering app, if he already got a job assigned
    var optionalAssignedDelivery =
        DriverDigitalTwinClient.fromContext(ctx, ctx.key()).getAssignedDelivery().await();

    // If there is no job, ask again after a short delay
    if (optionalAssignedDelivery.isEmpty()) {
      thisDriverSim.send().pollForWork(Duration.ofMillis(POLL_INTERVAL));
      return;
    }

    // If there is a job, start the delivery
    var delivery = optionalAssignedDelivery.get();
    var newAssignedDelivery =
        new AssignedDelivery(
            delivery.getDriverId(),
            delivery.getOrderId(),
            delivery.getRestaurantId(),
            delivery.getRestaurantLocation(),
            delivery.getCustomerLocation());
    ctx.set(ASSIGNED_DELIVERY, newAssignedDelivery);

    // Start moving to the delivery pickup location
    thisDriverSim.send().move(Duration.ofMillis(MOVE_INTERVAL));
  }

  /** Periodically lets the food ordering app know the new location */
  @Handler
  public void move(ObjectContext ctx) throws TerminalException {
    var thisDriverSim = DriverMobileAppSimulatorClient.fromContext(ctx, ctx.key());
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
    producer.sendDriverUpdate(ctx.key(), JacksonSerdes.of(Location.class).serialize(newLocation).toByteArray());

    // If we reached the destination, notify the food ordering app
    if (newLocation.equals(nextDestination)) {
      // If the delivery was already picked up, then that means it now arrived at the customer
      if (assignedDelivery.isOrderPickedUp()) {
        // Delivery is delivered to customer
        ctx.clear(ASSIGNED_DELIVERY);

        // Notify the driver's digital twin in the food ordering app of the delivery success
        DriverDigitalTwinClient.fromContext(ctx, ctx.key()).notifyDeliveryDelivered().await();

        // Take a small break before starting the next delivery
        ctx.sleep(Duration.ofMillis(PAUSE_BETWEEN_DELIVERIES));

        // Tell the driver's digital twin in the food ordering app, that he is available
        DriverDigitalTwinClient.fromContext(ctx, ctx.key())
            .send()
            .setDriverAvailable(GeoUtils.DEMO_REGION);

        // Start polling for work
        DriverMobileAppSimulatorClient.fromContext(ctx, ctx.key()).send().pollForWork();
        return;
      }

      // If the delivery was not picked up yet, then that means the driver now arrived at the
      // restaurant
      // and will start the delivery
      assignedDelivery.notifyPickup();
      ctx.set(ASSIGNED_DELIVERY, assignedDelivery);
      DriverDigitalTwinClient.fromContext(ctx, ctx.key()).notifyDeliveryPickup().await();
    }

    // Call this method again after a short delay
    thisDriverSim.send().move(Duration.ofMillis(MOVE_INTERVAL));
  }

  public static void main(String[] args) {
    // external mobile app on driver's phone
    RestateHttpServer.listen(Endpoint.bind(new DriverMobileAppSimulator()), 9081);
  }
}
