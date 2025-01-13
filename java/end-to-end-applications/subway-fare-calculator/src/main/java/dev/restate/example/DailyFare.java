package dev.restate.example;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class DailyFare {

  private static final long PRICE_SINGLE_TICKET = 210;
  private static final long PRICE_DAY_TICKET = 830;

  private long totalChargeOfToday;

  public DailyFare() {
    this.totalChargeOfToday = 0L;
  }

  @JsonCreator
  public DailyFare(@JsonProperty("cost") long cost) {
    this.totalChargeOfToday = cost;
  }

  public long getTotalChargeOfToday() {
    return totalChargeOfToday;
  }

  public long addTrip(String startStation, String endStation) {
    long costToAdd = Math.min(PRICE_DAY_TICKET - totalChargeOfToday, PRICE_SINGLE_TICKET);
    totalChargeOfToday += costToAdd;
    return costToAdd;
  }

  public long upgradeToDayTicket() {
    long costToAdd = PRICE_DAY_TICKET - totalChargeOfToday;
    totalChargeOfToday = PRICE_DAY_TICKET;
    return costToAdd;
  }
}
