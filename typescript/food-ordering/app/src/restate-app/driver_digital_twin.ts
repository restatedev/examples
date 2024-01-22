import * as restate from "@restatedev/restate-sdk";
import * as driverDeliveryMatcher from "./driver_delivery_matcher";
import * as deliveryManager from "./delivery_manager";
import {DeliveryRequest, DriverStatus, Location} from "./types/types";

/**
 * Digital twin for the driver. Represents a driver and his status, assigned delivery, and location.
 * Keyed by driver ID. The actual driver would have an application (mocked by Driver Mobile App Simulator) that
 * calls this service.
 */

// Current status of the driver: idle, waiting for work, or delivering
const DRIVER_STATUS = "driver-status";
// Only set if the driver is currently doing a delivery
const ASSIGNED_DELIVERY = "assigned-delivery";
// Current location of the driver
const DRIVER_LOCATION = "driver-location";

/**
 * When the driver starts his work day or finishes a delivery, his application (Driver mobile app simulator)
 * calls this method.
 */
async function setDriverAvailable(ctx: restate.RpcContext, driverId: string, region: string): Promise<void> {
  await expectStatus(DriverStatus.IDLE, ctx);

  ctx.set(DRIVER_STATUS, DriverStatus.WAITING_FOR_WORK);
  ctx.send(driverDeliveryMatcher.service).setDriverAvailable(region, driverId);
}

/**
 * Gets called by the delivery manager when this driver was assigned to do the delivery. Updates
 * the status of the digital driver twin, and notifies the delivery service of its current
 * location.
 */
async function assignDeliveryJob(ctx: restate.RpcContext, _driverId: string, deliveryRequest: DeliveryRequest): Promise<void> {
    await expectStatus(DriverStatus.WAITING_FOR_WORK, ctx);

    // Update the status and assigned delivery information of the driver
    ctx.set(DRIVER_STATUS, DriverStatus.DELIVERING);
    ctx.set(ASSIGNED_DELIVERY, deliveryRequest);

    // Notify current location to the delivery service
    const currentLocation = await ctx.get<Location>(DRIVER_LOCATION);
    if (currentLocation) {
        ctx.send(deliveryManager.service).handleDriverLocationUpdate(deliveryRequest.deliveryId, currentLocation);
    }
}

/**
 * Gets called by the driver's mobile app when he has picked up the delivery from the restaurant.
 */
async function notifyDeliveryPickUp(ctx: restate.RpcContext, _driverId: string): Promise<void> {
  await expectStatus(DriverStatus.DELIVERING, ctx);

  // Retrieve the ongoing delivery and update its status
  const assignedDelivery = (await ctx.get<DeliveryRequest>(ASSIGNED_DELIVERY))!;

  // Update the status of the delivery in the delivery manager
  ctx.send(deliveryManager.service).notifyDeliveryPickup(assignedDelivery.deliveryId);
}

/**
 * Gets called by the driver's mobile app when he has delivered the order to the customer.
 */
async function notifyDeliveryDelivered(ctx: restate.RpcContext, _driverId: string): Promise<void> {
  await expectStatus(DriverStatus.DELIVERING, ctx);

  // Retrieve the ongoing delivery
  const assignedDelivery = (await ctx.get<DeliveryRequest>(ASSIGNED_DELIVERY))!;
  // Clean up the state
  ctx.clear(ASSIGNED_DELIVERY);

  // Notify the delivery service that the delivery was delivered
  ctx.send(deliveryManager.service).notifyDeliveryDelivered(assignedDelivery.deliveryId);

  // Update the status of the driver to idle
  ctx.set(DRIVER_STATUS, DriverStatus.IDLE);
}

/** Gets called by the driver's mobile app when he has moved to a new location. */
async function handleDriverLocationUpdateEvent(ctx: restate.RpcContext, event: restate.Event) {
    const location = event.json<Location>();
    ctx.set(DRIVER_LOCATION, location);
    const assignedDelivery = await ctx.get<DeliveryRequest>(ASSIGNED_DELIVERY);
    if (assignedDelivery) {
        ctx.send(deliveryManager.service).handleDriverLocationUpdate(assignedDelivery.deliveryId, location);
    }
}

/**
 * Returns null if no delivery was assigned, or the delivery information if a delivery was
 * assigned. Gets polled by the driver's mobile app at regular intervals to check if a delivery
 * got assigned to him.
 */
function getAssignedDelivery(ctx: restate.RpcContext): Promise<DeliveryRequest | null> {
  return ctx.get<DeliveryRequest>(ASSIGNED_DELIVERY);
}

export const router = restate.keyedRouter({
    // external API
    setDriverAvailable,
    notifyDeliveryPickUp,
    notifyDeliveryDelivered,
    getAssignedDelivery,
    assignDeliveryJob,
    // event handler
    handleDriverLocationUpdateEvent: restate.keyedEventHandler(handleDriverLocationUpdateEvent)

})

export type api = typeof router;
export const service: restate.ServiceApi<api> = { path: "driver-digital-twin" };


// --------------------------------------------------------
//  utils
// --------------------------------------------------------

// Utility function to check if the driver is in the expected state
// If the driver is in a different state, a terminal exception is thrown that stops any retries
// from taking place.
// Is only called from inside the driver service.
async function expectStatus(expectedStatus: DriverStatus, ctx: restate.RpcContext): Promise<void> {
  const currentStatus = (await ctx.get<DriverStatus>(DRIVER_STATUS)) ?? DriverStatus.IDLE;

  if (currentStatus !== expectedStatus) {
    throw new restate.TerminalError(`Driver status wrong. Expected ${expectedStatus} but was ${currentStatus}`);
  }
}