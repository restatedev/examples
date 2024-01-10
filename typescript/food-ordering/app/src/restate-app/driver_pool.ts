import * as restate from "@restatedev/restate-sdk";
import { DriverRequest } from "./types/types";


const AVAILABLE_DRIVERS_STATE = "available-drivers";
const PENDING_DRIVER_REQUESTS_STATE = "waiting-deliveries";

async function driverAvailable(ctx: restate.RpcContext, _region: string, driverId: string): Promise<void> {
  // if we have deliveries already waiting, assign those
  const waitingDriverRequests = await ctx.get<DriverRequest[]>(PENDING_DRIVER_REQUESTS_STATE);

  if (waitingDriverRequests && waitingDriverRequests.length > 0) {
    const nextRequest = waitingDriverRequests.shift()!;
    ctx.set(PENDING_DRIVER_REQUESTS_STATE, waitingDriverRequests);

    ctx.resolveAwakeable(nextRequest.promiseId, driverId);

    return;
  }

  // otherwise remember driver as available
  const drivers = (await ctx.get<string[]>(AVAILABLE_DRIVERS_STATE)) ?? [];
  drivers.push(driverId);
  ctx.set(AVAILABLE_DRIVERS_STATE, drivers);
}

async function requestDriverForOrder(ctx: restate.RpcContext, _region: string, request: DriverRequest): Promise<void> {
    const availableDrivers = (await ctx.get<string[]>(AVAILABLE_DRIVERS_STATE));

    // if a driver is available, assign the delivery right away
    if (availableDrivers && availableDrivers.length > 0) {
        const driver = availableDrivers.shift()!;
        ctx.set(AVAILABLE_DRIVERS_STATE, availableDrivers);

        ctx.resolveAwakeable(request.promiseId, driver);

        return;
    }

    // else store the request and wait for a driver
    const waitingDriverRequests = (await ctx.get<DriverRequest[]>(PENDING_DRIVER_REQUESTS_STATE)) ?? [];
    waitingDriverRequests.push(request);
    ctx.set(PENDING_DRIVER_REQUESTS_STATE, waitingDriverRequests);
}

export const router = restate.keyedRouter({
    driverAvailable,
    requestDriverForOrder,
})

export type api = typeof router;
export const service : restate.ServiceApi<api> = { path: "driverpool" };