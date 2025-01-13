package dev.restate.example;

import dev.restate.example.apis.CardStatusServiceApi;
import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.SharedObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import dev.restate.sdk.serde.jackson.JacksonSerdes;

import java.util.Optional;

import static dev.restate.example.apis.Utils.delayTillEndOfDay;

@VirtualObject
public class CardTracker {

  // References to K/V state stored in Restate
  private static final StateKey<Boolean> AUTHORIZED = StateKey.of("authorized", JsonSerdes.BOOLEAN);
  private static final StateKey<String> ONGOING_JOURNEY = StateKey.of("journey_start", JsonSerdes.STRING);
  private static final StateKey<DailyFare> TOTAL_FARE_TODAY = StateKey.of("fare", JacksonSerdes.of(DailyFare.class));

  @Handler
  public String badgeIn(ObjectContext ctx, String station) {
    final String cardId = ctx.key();

    // authorize card if we haven't done that today
    final boolean authorized = ctx.get(AUTHORIZED).orElseGet(() -> {
      boolean success = Payments.authorizeCard(ctx, cardId);
      ctx.set(AUTHORIZED, success);

      if (!success) {
        // make call to status cache to block this card at the gates
        ctx.run("block card", () -> CardStatusServiceApi.tagCardAsBlocked(cardId));
      }

      return success;
    });
    if (!authorized) {
      return "BLOCKED";
    }

    // start this journey
    ctx.set(ONGOING_JOURNEY, station);

    // ensure this journey finishes by end of operations
    CardTrackerClient.fromContext(ctx, cardId)
        .send(delayTillEndOfDay())
        .finalizeAllJourneys();

    return "OK";
  }

  @Handler
  public String badgeOut(ObjectContext ctx, String exitStation) {
    final String cardId = ctx.key();

    final Optional<String> startingStation = ctx.get(ONGOING_JOURNEY);
    if (startingStation.isEmpty()) {
      return "BLOCKED";
    }
    ctx.clear(ONGOING_JOURNEY);

    final DailyFare fare = ctx.get(TOTAL_FARE_TODAY).orElseGet(DailyFare::new);
    final long tripPrice = fare.addTrip(startingStation.get(), exitStation);
    ctx.set(TOTAL_FARE_TODAY, fare);

    return tryCharge(ctx, cardId, tripPrice) ? "OK" : "BLOCKED";
  }

  @Handler
  public void finalizeAllJourneys(ObjectContext ctx) {
    // Executes at the end of the day
    // If the card still has an ongoing journey, end it and charge the day ticket
    ctx.get(ONGOING_JOURNEY).ifPresent((String startStation) -> {
      String cardId = ctx.key();
      DailyFare fare = ctx.get(TOTAL_FARE_TODAY).orElseGet(DailyFare::new);
      long remainderToPay = fare.upgradeToDayTicket();
      tryCharge(ctx, cardId, remainderToPay);
      ctx.clear(ONGOING_JOURNEY);
    });

    ctx.clear(TOTAL_FARE_TODAY);
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

  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder()
            .bind(new CardTracker())
            .buildAndListen(9080);
  }
}
