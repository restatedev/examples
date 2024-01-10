import * as restate from "@restatedev/restate-sdk";
import * as driver from "./driver";
import * as driverpool from "./driver_pool";
import * as geo from "./utils/geo";
import { DEMO_REGION, Location, Order, Status } from "./types/types";
import * as orderstatus from "./order_status_service";
import { v4 as uuidv4 } from "uuid";

type OrderAndPromise = {
    order: Order,
    promise: string
}

type OngoingDelivery = {
    orderId: string,
    orderPromise: string,
    restaurantId: string,
    restaurantLocation: Location,
    customerLocation: Location,
    orderPickedUp: boolean
}

const DELIVERY_STATE = "state";

async function start(ctx: restate.RpcContext, deliveryId: string, { order, promise }: OrderAndPromise) {

  // temporary placeholder: random location
  const [restaurantLocation, customerLocation] = await ctx.sideEffect(async () => [geo.randomLocation(), geo.randomLocation()]);
 
  const delivery: OngoingDelivery = {
    orderId: order.id,
    orderPromise: promise,
    restaurantId: order.restaurantId,
    restaurantLocation,
    customerLocation,
    orderPickedUp: false
  }
  
  ctx.set(DELIVERY_STATE, delivery);

  // acquire a driver first
  const driverPromise = ctx.awakeable<string>();
  ctx.send(driverpool.service).requestDriverForOrder(DEMO_REGION, { promiseId: driverPromise.id });
  const driverId = await driverPromise.promise;

  // driver gets the work 
  await ctx
      .rpc(driver.service)
      .assignDeliveryJob(driverId, {
          deliveryId,
          restaurantId: order.restaurantId,
          restaurantLocation: delivery.restaurantLocation,
          customerLocation: delivery.customerLocation
      });
  
  ctx.send(orderstatus.service).setStatus(order.id, Status.WAITING_FOR_DRIVER);
}

async function deliveryPickedUp(ctx: restate.RpcContext, _deliveryId: string) {
  const delivery = (await ctx.get<OngoingDelivery>(DELIVERY_STATE))!;
  delivery.orderPickedUp = true;
  ctx.set(DELIVERY_STATE, delivery);

  ctx.send(orderstatus.service).setStatus(delivery.orderId, Status.IN_DELIVERY);
}

async function deliveryDelivered(ctx: restate.RpcContext, _deliveryId: string) {
  const delivery = (await ctx.get<OngoingDelivery>(DELIVERY_STATE))!;
  ctx.clear(DELIVERY_STATE);

  ctx.resolveAwakeable(delivery.orderPromise, null);
}

async function driverLocationUpdate(ctx: restate.RpcContext, _deliveryId: string, location: Location) {
  const delivery = (await ctx.get<OngoingDelivery>(DELIVERY_STATE))!;

  const time = delivery.orderPickedUp
    ? geo.calculateEtaMillis(location, delivery.customerLocation) 
    : geo.calculateEtaMillis(location, delivery.restaurantLocation)
      + geo.calculateEtaMillis(delivery.restaurantLocation, delivery.customerLocation);

  ctx.send(orderstatus.service).setETA(delivery.orderId, time);
}

export const router = restate.keyedRouter({
    start,
    deliveryPickedUp,
    deliveryDelivered,
    driverLocationUpdate,
});

export type api = typeof router;
export const service: restate.ServiceApi<api> = { path: "delivery" };
