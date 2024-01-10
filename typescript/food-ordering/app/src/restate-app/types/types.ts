export type Product = {
  productId: string;
  description: string;
  quantity: number;
};

export type Order = {
  id: string,
  restaurantId: string;
  products: Product[];
  totalCost: number;
  deliveryDelay: number;
};

export enum Status {
  NEW = "NEW",
  CREATED = "CREATED",
  SCHEDULED = "SCHEDULED",
  IN_PREPARATION = "IN_PREPARATION",
  SCHEDULING_DELIVERY = "SCHEDULING_DELIVERY",
  WAITING_FOR_DRIVER = "WAITING_FOR_DRIVER",
  IN_DELIVERY = "IN_DELIVERY",
  DELIVERED = "DELIVERED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export type OrderStatus = {
  status?: Status;
  eta?: number;
}

export type DeliveryRequest = {
  deliveryId: string,
  restaurantId: string,
  restaurantLocation: Location,
  customerLocation: Location
}

export type PendingDelivery = {
  promiseId: string;
}

export type Location = {
  long: number,
  lat: number,
}

export type LocationTimestamp = {
  long: number,
  lat: number,
  timestamp: number
}

export const DEMO_REGION = "San Jose (CA)";


export type OrderAndPromise = {
  order: Order,
  promise: string
}

export type DeliveryInformation = {
  orderId: string,
  orderPromise: string,
  restaurantId: string,
  restaurantLocation: Location,
  customerLocation: Location,
  orderPickedUp: boolean
}

export type DeliveryState = {
  currentDelivery: DeliveryRequest,
  orderPickedUp: boolean
}