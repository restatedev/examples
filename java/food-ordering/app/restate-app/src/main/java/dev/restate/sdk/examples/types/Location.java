package dev.restate.sdk.examples.types;

import dev.restate.sdk.examples.generated.OrderProto;

public class Location {
  public double lon;
  public double lat;

  public Location(double lon, double lat) {
    this.lon = lon;
    this.lat = lat;
  }

  public Location() {}

  public double getLon() {
    return lon;
  }

  public void setLon(double lon) {
    this.lon = lon;
  }

  public double getLat() {
    return lat;
  }

  public void setLat(double lat) {
    this.lat = lat;
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
