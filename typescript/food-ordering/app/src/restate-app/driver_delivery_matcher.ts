import * as restate from "@restatedev/restate-sdk";
import { PendingDelivery } from "./types/types";

/**
 * Links available drivers to delivery requests Keyed by the region. Each region has a pool of
 * available drivers and orders waiting for a driver. This service is responsible for tracking and
 * matching the two.
 */

// Deliveries that are waiting for a driver to become available
const PENDING_DELIVERIES = "pending-deliveries";
// Drivers that are waiting for new delivery requests
const AVAILABLE_DRIVERS = "available-drivers";

/**
 * Gets called when a new driver becomes available. Links the driver to the next delivery waiting
 * in line. If no pending deliveries, driver is added to the available driver pool
 */
async function setDriverAvailable(ctx: restate.RpcContext, _region: string, driverId: string): Promise<void> {
  // if we have deliveries already waiting, assign those
  const pendingDeliveries = await ctx.get<PendingDelivery[]>(PENDING_DELIVERIES);

  // If there is a pending delivery, assign it to the driver
  if (pendingDeliveries && pendingDeliveries.length > 0) {
    // Update the queue in state. Delivery was removed.
    const nextDelivery = pendingDeliveries.shift()!;
    ctx.set(PENDING_DELIVERIES, pendingDeliveries);
    // Notify that delivery is ongoing
    ctx.resolveAwakeable(nextDelivery.promiseId, driverId);
    return;
  }

  // otherwise remember driver as available
  const availableDrivers = (await ctx.get<string[]>(AVAILABLE_DRIVERS)) ?? [];
  availableDrivers.push(driverId);
  ctx.set(AVAILABLE_DRIVERS, availableDrivers);
}

/**
 * Gets called when a new delivery gets scheduled. Links the delivery to the next driver
 * available. If no available drivers, the delivery is added to the pending deliveries queue
 */
async function requestDriverForDelivery(ctx: restate.RpcContext, _region: string, request: PendingDelivery): Promise<void> {
    const availableDrivers = (await ctx.get<string[]>(AVAILABLE_DRIVERS));

    // if a driver is available, assign the delivery right away
    if (availableDrivers && availableDrivers.length > 0) {
        // Remove driver from the pool
        const nextAvailableDriver = availableDrivers.shift()!;
        ctx.set(AVAILABLE_DRIVERS, availableDrivers);

        // Notify that delivery is ongoing
        ctx.resolveAwakeable(request.promiseId, nextAvailableDriver);
        return;
    }

    // otherwise store the delivery request until a new driver becomes available
    const pendingDeliveries = (await ctx.get<PendingDelivery[]>(PENDING_DELIVERIES)) ?? [];
    pendingDeliveries.push(request);
    ctx.set(PENDING_DELIVERIES, pendingDeliveries);
}

export const router = restate.keyedRouter({
    setDriverAvailable,
    requestDriverForDelivery,
})

export type api = typeof router;
export const service : restate.ServiceApi<api> = { path: "driver-delivery-matcher" };