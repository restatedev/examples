import * as restate from "@restatedev/restate-sdk";
import * as driverpool from "./driver_pool";
import * as delivery from "./delivery";
import { DeliveryRequest, Location } from "../types/types";

// --------------------------------------------------------
//  Digital Twin for the Driver
// --------------------------------------------------------

enum DriverStatus {
  IDLE = "IDLE",
  WAITING_FOR_WORK = "WAITING_FOR_WORK",
  DELIVERING = "DELIVERING"
}

const DRIVER_STATUS_STATE = "status";
const CURRENT_DELIVERY_STATE = "delivery";
const LOCATION_STATE = "location";

// -----------------------------------------------------------

async function driverAvailable(ctx: restate.RpcContext, driverId: string, region: string): Promise<void> {
  await expectStatus(DriverStatus.IDLE, ctx);

  ctx.set(DRIVER_STATUS_STATE, DriverStatus.WAITING_FOR_WORK);
  ctx.send(driverpool.service).driverAvailable(region, driverId);
}

async function notifyDeliveryPickUp(ctx: restate.RpcContext, driverId: string): Promise<void> {
  await expectStatus(DriverStatus.DELIVERING, ctx);

  const request = (await ctx.get<DeliveryRequest>(CURRENT_DELIVERY_STATE))!;
  ctx.send(delivery.service).deliveryPickedUp(request.deliveryId);
}

async function notifyDeliveryDelivered(ctx: restate.RpcContext, driverId: string): Promise<void> {
  await expectStatus(DriverStatus.DELIVERING, ctx);

  const request = (await ctx.get<DeliveryRequest>(CURRENT_DELIVERY_STATE))!;
  ctx.clear(CURRENT_DELIVERY_STATE);
  ctx.send(delivery.service).deliveryDelivered(request.deliveryId);

  ctx.set(DRIVER_STATUS_STATE, DriverStatus.IDLE);
}

async function assignDeliveryJob(ctx: restate.RpcContext, _driverId: string, job: DeliveryRequest): Promise<void> {
    await expectStatus(DriverStatus.WAITING_FOR_WORK, ctx);

    ctx.set(DRIVER_STATUS_STATE, DriverStatus.DELIVERING);
    ctx.set(CURRENT_DELIVERY_STATE, job);

    const currentLocation = await ctx.get<Location>(LOCATION_STATE);
    if (currentLocation) {
      ctx.send(delivery.service).driverLocationUpdate(job.deliveryId, currentLocation);
    }
}

async function updateCoordinate(ctx: restate.RpcContext, _driverId: string, location: Location): Promise<void> {
    ctx.set(LOCATION_STATE, location);
    await updateDeliveryIfExists(ctx, location);
}

async function coordinateUpdateHandler(ctx: restate.RpcContext, event: restate.Event) {
  const driver = event.key;
  const location = event.json<Location>();
  await updateCoordinate(ctx, driver, location);
}

function pollAssignedDelivery(ctx: restate.RpcContext): Promise<DeliveryRequest | null> {
  return ctx.get<DeliveryRequest>(CURRENT_DELIVERY_STATE);
}


export const router = restate.keyedRouter({
    // external API
    driverAvailable,
    notifyDeliveryPickUp,
    notifyDeliveryDelivered,
    pollAssignedDelivery,

    // internal callbacks
    assignDeliveryJob,

    // event handler
    updateCoordinate,
    handleUpdateEvent: restate.keyedEventHandler(coordinateUpdateHandler)

})

export type api = typeof router;
export const service: restate.ServiceApi<api> = { path: "driver" };


// --------------------------------------------------------
//  utils
// --------------------------------------------------------

async function updateDeliveryIfExists(ctx: restate.RpcContext, location: Location): Promise<void> {
    const request = await ctx.get<DeliveryRequest>(CURRENT_DELIVERY_STATE);
    if (request) {
      ctx.send(delivery.service).driverLocationUpdate(request.deliveryId, location);
    }
}

async function expectStatus(expectedStatus: DriverStatus, ctx: restate.RpcContext): Promise<void> {
  const currentStatus = (await ctx.get<DriverStatus>(DRIVER_STATUS_STATE)) ?? DriverStatus.IDLE;

  if (currentStatus !== expectedStatus) {
    throw new restate.TerminalError(`Driver status wrong. Expected ${expectedStatus} but was ${currentStatus}`);
  }
}