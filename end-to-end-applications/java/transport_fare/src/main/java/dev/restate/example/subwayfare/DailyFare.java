package dev.restate.example.subwayfare;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class DailyFare {

  private static final long SHORT_TRIP = 210;
  private static final long LONG_TRIP = 210;

  private static final long MAX_DAILY = 830;

  private long currentDaily;

  public DailyFare() {
    this.currentDaily = 0L;
  }

  @JsonCreator
  public DailyFare(@JsonProperty("currentDaily") long currentDaily) {
    this.currentDaily = currentDaily;
  }

  public long getCurrentDaily() {
    return currentDaily;
  }

  public long addTrip(String startStating, String endStation) {
    long tripCost = SHORT_TRIP;
    long diff = Math.min(MAX_DAILY - currentDaily, tripCost);
    currentDaily += diff;
    return diff;
  }

  public long makeDaily() {
    long diff = MAX_DAILY - currentDaily;
    currentDaily = MAX_DAILY;
    return diff;
  }
}
