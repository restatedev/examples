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

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import dev.restate.sdk.examples.generated.OrderProto;

public class Location {
  private final double lon;
  private final double lat;

  @JsonCreator
  public Location(@JsonProperty("lon") double lon, @JsonProperty("lat") double lat) {
    this.lon = lon;
    this.lat = lat;
  }

  public double getLon() {
    return lon;
  }

  public double getLat() {
    return lat;
  }

  public static Location fromProto(OrderProto.Location proto) {
    return new Location(proto.getLon(), proto.getLat());
  }

  public OrderProto.Location toProto() {
    return OrderProto.Location.newBuilder().setLon(lon).setLat(lat).build();
  }

  public boolean equals(Location other) {
    return lon == other.lon && lat == other.lat;
  }
}
