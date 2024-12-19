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
package dev.restate.sdk.examples.utils

import dev.restate.sdk.examples.Location
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.sqrt

object GeoUtils {
  const val DEMO_REGION: String = "San Jose (CA)"

  private const val LONG_MIN = -0.0675
  private const val LONG_MAX = 0.0675
  private const val LAT_MIN = -0.0675
  private const val LAT_MAX = 0.0675
  private const val SPEED = 0.005

  fun randomInInterval(min: Double, max: Double): Double {
    val range = max - min
    return Math.random() * range + min
  }

  fun randomLocation(): Location {
    return Location(randomInInterval(LONG_MIN, LONG_MAX), randomInInterval(LAT_MIN, LAT_MAX))
  }

  fun moveToDestination(location: Location, destination: Location): Location {
    val dx = destination.lon - location.lon
    val dy = destination.lat - location.lat
    val distance = sqrt(dx * dx + dy * dy)
    if (distance < SPEED) {
      return destination
    }
    val ratio = SPEED / distance
    return Location(location.lon + dx * ratio, location.lat + dy * ratio)
  }

  fun calculateEtaMillis(currentLocation: Location, targetLocation: Location): Long {
    val longDiff = abs(targetLocation.lon - currentLocation.lon)
    val latDiff = abs(targetLocation.lat - currentLocation.lat)
    val distance = max(longDiff, latDiff)
    return Math.round(1000 * distance / SPEED)
  }
}
