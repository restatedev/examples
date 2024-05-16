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
package dev.restate.sdk.examples

import kotlinx.serialization.Serializable

@Serializable
data class AssignDeliveryRequest(
    val orderId: String,
    val restaurantId: String,
    val restaurantLocation: Location,
    val customerLocation: Location
)

@Serializable
data class AssignedDelivery(
    val driverId: String,
    val orderId: String,
    val restaurantId: String,
    val restaurantLocation: Location,
    val customerLocation: Location,
    var isOrderPickedUp: Boolean = false
) {
  fun notifyPickup() {
    isOrderPickedUp = true
  }
}

@Serializable
data class DeliveryInformation(
    val orderId: String,
    val callbackId: String,
    val restaurantId: String,
    val restaurantLocation: Location,
    val customerLocation: Location,
    var isOrderPickedUp: Boolean
) {
  fun notifyPickup() {
    this.isOrderPickedUp = true
  }
}

@Serializable data class DeliveryRequest(val restaurantId: String, val callback: String)

@Serializable
enum class DriverStatus {
  IDLE,
  WAITING_FOR_WORK,
  DELIVERING
}

@Serializable data class Location(val lon: Double, val lat: Double)

@Serializable
data class OrderRequest(
    val orderId: String,
    val restaurantId: String,
    val products: List<Product>,
    val totalCost: Double,
    val deliveryDelay: Int
)

@Serializable data class Product(val productId: String, val description: String, val quantity: Int)

@Serializable
enum class StatusEnum {
  NEW,
  CREATED,
  SCHEDULED,
  IN_PREPARATION,
  SCHEDULING_DELIVERY,
  WAITING_FOR_DRIVER,
  IN_DELIVERY,
  DELIVERED,
  REJECTED,
  CANCELLED,
  UNKNOWN
}

@Serializable data class GetAssignedDeliveryResult(val assignedDelivery: AssignedDelivery? = null)

@Serializable data class OrderStatus(val status: StatusEnum, val eta: Long)
