import * as restate from "@restatedev/restate-sdk";
import * as driverDigitalTwin from "./driver_digital_twin";
import * as driverDeliveryMatcher from "./driver_delivery_matcher";
import * as geo from "./utils/geo";
import {DEMO_REGION, Location, DeliveryInformation, OrderAndPromise, Status} from "./types/types";
import * as orderstatus from "./order_status_service";

/**
 * Manages the delivery of the order to the customer. Keyed by the order ID (similar to the
 * OrderService and OrderStatusService).
 */

// State key to store all relevant information about the delivery.
const DELIVERY_INFO = "delivery-info";

/**
 * Finds a driver, assigns the delivery job to the driver, and updates the status of the order.
 * Gets called by the OrderService when a new order has been prepared and needs to be delivered.
 */
async function start(ctx: restate.RpcContext, deliveryId: string, { order, promise }: OrderAndPromise) {

  // Temporary placeholder: random location
  const [restaurantLocation, customerLocation] = await ctx.sideEffect(async () => [geo.randomLocation(), geo.randomLocation()]);

  // Store the delivery information in Restate's state store
  const deliveryInfo: DeliveryInformation = {
    orderId: order.id,
    orderPromise: promise,
    restaurantId: order.restaurantId,
    restaurantLocation,
    customerLocation,
    orderPickedUp: false
  }
  ctx.set(DELIVERY_INFO, deliveryInfo);

  // Acquire a driver
  const driverPromise = ctx.awakeable<string>();
  ctx.send(driverDeliveryMatcher.service).requestDriverForDelivery(DEMO_REGION, { promiseId: driverPromise.id });
  // Wait until the driver pool service has located a driver
  // This awakeable gets resolved either immediately when there is a pending delivery
  // or later, when a new delivery comes in.
  const driverId = await driverPromise.promise;

  // Assign the driver to the job
  await ctx
      .rpc(driverDigitalTwin.service)
      .assignDeliveryJob(driverId, {
          deliveryId,
          restaurantId: order.restaurantId,
          restaurantLocation: deliveryInfo.restaurantLocation,
          customerLocation: deliveryInfo.customerLocation
      });

  // Update the status of the order to "waiting for the driver"
  ctx.send(orderstatus.service).setStatus(order.id, Status.WAITING_FOR_DRIVER);
}

/**
 * Notifies that the delivery was picked up. Gets called by the DriverService.NotifyDeliveryPickup
 * when the driver has arrived at the restaurant.
 */
async function notifyDeliveryPickup(ctx: restate.RpcContext, _deliveryId: string) {
  // Retrieve the delivery information for this delivery
  const delivery = (await ctx.get<DeliveryInformation>(DELIVERY_INFO))!;
  // Update the status of the delivery to "picked up"
  delivery.orderPickedUp = true;
  ctx.set(DELIVERY_INFO, delivery);

  // Update the status of the order to "in delivery"
  ctx.send(orderstatus.service).setStatus(delivery.orderId, Status.IN_DELIVERY);
}

/**
 * Notifies that the order was delivered. Gets called by the DriverService.NotifyDeliveryDelivered
 * when the driver has delivered the order to the customer.
 */
async function notifyDeliveryDelivered(ctx: restate.RpcContext, _deliveryId: string) {
  // Retrieve the delivery information for this delivery
  const delivery = (await ctx.get<DeliveryInformation>(DELIVERY_INFO))!;

  // Order has been delivered, so state can be cleared
  ctx.clear(DELIVERY_INFO);

  // Notify the OrderService that the delivery has been completed
  ctx.resolveAwakeable(delivery.orderPromise, null);
}

/**
 * Updates the location of the order. Gets called by
 * DriverService.HandleDriverLocationUpdateEvent() (digital twin of the driver) when the driver
 * has moved to a new location.
 */
async function handleDriverLocationUpdate(ctx: restate.RpcContext, _deliveryId: string, location: Location) {
  // Retrieve the delivery information for this delivery
  const delivery = (await ctx.get<DeliveryInformation>(DELIVERY_INFO))!;

  // Parse the new location, and calculate the ETA of the delivery to the customer
  const eta = delivery.orderPickedUp
    ? geo.calculateEtaMillis(location, delivery.customerLocation) 
    : geo.calculateEtaMillis(location, delivery.restaurantLocation)
      + geo.calculateEtaMillis(delivery.restaurantLocation, delivery.customerLocation);

  // Update the ETA of the order
  ctx.send(orderstatus.service).setETA(delivery.orderId, eta);
}

export const router = restate.keyedRouter({
    start,
    notifyDeliveryPickup,
    notifyDeliveryDelivered,
    handleDriverLocationUpdate,
});

export type api = typeof router;
export const service: restate.ServiceApi<api> = { path: "delivery-manager" };
