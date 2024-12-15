package dev.restate.example.subwayfare;

import dev.restate.example.subwayfare.apis.CardStatusServiceApi;
import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.SharedObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.serde.jackson.JacksonSerdes;

import java.util.Optional;

import static dev.restate.example.subwayfare.apis.Utils.threeAm;

@VirtualObject
public class CardTracker {

  @Handler
  public String badgeIn(ObjectContext ctx, String station) {
    final String cardRef = ctx.key();

    // authorize card if we haven't done that today
    final boolean authorized = ctx.get(AUTHORIZED).orElseGet(() -> {
      boolean success = Payments.authorizeCard(ctx, cardRef);
      ctx.set(AUTHORIZED, success);

      if (!success) {
        // make call to status cache to block this card at the gates
        ctx.run("block card", () -> CardStatusServiceApi.tagCardAsBlocked(cardRef));
      }

      return success;
    });
    if (!authorized) {
      return "BLOCKED";
    }

    // start this journey
    ctx.set(ONGOING_JOURNEY, station);

    // ensure this journey finishes by end of operations
    CardTrackerClient.fromContext(ctx, cardRef)
        .send(threeAm())
        .endOfDay();

    return "OK";
  }

  @Handler
  public String badgeOut(ObjectContext ctx, String exitStation) {
    final String cardRef = ctx.key();

    final Optional<String> startingStation = ctx.get(ONGOING_JOURNEY);
    if (startingStation.isEmpty()) {
      return "BLOCKED";
    }
    ctx.clear(ONGOING_JOURNEY);

    final DailyFare fare = ctx.get(FARE).orElseGet(DailyFare::new);
    final long tripPrice = fare.addTrip(startingStation.get(), exitStation);
    ctx.set(FARE, fare);

    return tryCharge(ctx, cardRef, tripPrice) ? "OK" : "BLOCKED";
  }

  @Handler
  public void endOfDay(ObjectContext ctx) {
    ctx.get(ONGOING_JOURNEY).ifPresent((String startStation) -> {
      String cardRef = ctx.key();
      DailyFare fare = ctx.get(FARE).orElseGet(DailyFare::new);
      long addedCharge = fare.makeDaily();
      tryCharge(ctx, cardRef, addedCharge);
      ctx.clear(ONGOING_JOURNEY);
    });

    ctx.clear(FARE);
  }

  @Shared
  public boolean isBlocked(SharedObjectContext ctx) {
    return !ctx.get(AUTHORIZED).orElse(true);
  }

  @Handler
  public void unblock(ObjectContext ctx) {
    ctx.clear(AUTHORIZED);
  }

  private boolean tryCharge(ObjectContext ctx, String cardRef, long amountCents) {
    if (amountCents == 0) {
      return true;
    }
    boolean paymentSuccess = Payments.chargeCard(ctx, cardRef, amountCents);
    if (!paymentSuccess) {
      ctx.set(AUTHORIZED, false);
      ctx.run("block card", () -> CardStatusServiceApi.tagCardAsBlocked(cardRef));
    }
    return paymentSuccess;
  }

  private static final StateKey<Boolean> AUTHORIZED = StateKey.of("authorized", JsonSerdes.BOOLEAN);
  private static final StateKey<String> ONGOING_JOURNEY = StateKey.of("journey_start", JsonSerdes.STRING);
  private static final StateKey<DailyFare> FARE = StateKey.of("fare", JacksonSerdes.of(DailyFare.class));
}
