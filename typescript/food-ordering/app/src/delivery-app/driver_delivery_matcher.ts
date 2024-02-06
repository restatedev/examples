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

import * as restate from "@restatedev/restate-sdk";
import { PendingDelivery } from "./types/types";

/**
 * Links available drivers to delivery requests Keyed by the region. Each region has a pool of
 * available drivers and orders waiting for a driver. This service is responsible for tracking and
 * matching the two.
 */
export const service : restate.ServiceApi<typeof router> = { path: "driver-delivery-matcher" };

const PENDING_DELIVERIES = "pending-deliveries";
const AVAILABLE_DRIVERS = "available-drivers";

export const router = restate.keyedRouter({
    setDriverAvailable: async (ctx: restate.RpcContext, _region: string, driverId: string) => {
        // if we have deliveries already waiting, assign those
        const pendingDeliveries = await ctx.get<PendingDelivery[]>(PENDING_DELIVERIES);
        if (pendingDeliveries && pendingDeliveries.length > 0) {
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
    },

    // Called when a new delivery gets scheduled.
    requestDriverForDelivery: async (ctx: restate.RpcContext, _region: string, request: PendingDelivery) => {
        // if a driver is available, assign the delivery right away
        const availableDrivers = (await ctx.get<string[]>(AVAILABLE_DRIVERS));
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
    },
})