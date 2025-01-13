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

package dev.restate.sdk.examples.types;

import dev.restate.sdk.common.Serde;
import dev.restate.sdk.serde.jackson.JacksonSerdes;

public class Location {

  public static final Serde<Location> SERDE = JacksonSerdes.of(Location.class);

  private final double lon;
  private final double lat;

  public Location(double lon, double lat) {
    this.lon = lon;
    this.lat = lat;
  }

  public double getLon() {
    return lon;
  }

  public double getLat() {
    return lat;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;

    Location location = (Location) o;
    return Double.compare(lon, location.lon) == 0 && Double.compare(lat, location.lat) == 0;
  }

  @Override
  public int hashCode() {
    int result = Double.hashCode(lon);
    result = 31 * result + Double.hashCode(lat);
    return result;
  }

  @Override
  public String toString() {
    return "Location{" + "lon=" + lon + ", lat=" + lat + '}';
  }
}
