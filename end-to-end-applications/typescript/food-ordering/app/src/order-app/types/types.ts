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

export enum DriverStatus {
    IDLE = "IDLE",
    WAITING_FOR_WORK = "WAITING_FOR_WORK",
    DELIVERING = "DELIVERING"
}
