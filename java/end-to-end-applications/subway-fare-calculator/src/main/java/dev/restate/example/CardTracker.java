package dev.restate.example;

import dev.restate.example.apis.CardStatusServiceApi;
import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import dev.restate.sdk.common.StateKey;

import java.util.Optional;

import static dev.restate.example.apis.Utils.delayTillEndOfDay;

@VirtualObject
public class CardTracker {

  // References to K/V state stored in Restate
  private static final StateKey<Boolean> AUTHORIZED = StateKey.of("authorized", Boolean.TYPE);
  private static final StateKey<String> ONGOING_JOURNEY = StateKey.of("journey_start", String.class);
  private static final StateKey<DailyFare> TOTAL_FARE_TODAY = StateKey.of("fare", DailyFare.class);

  @Handler
  public String badgeIn(String station) {
    final String cardId = Restate.key();
    var state = Restate.state();

    // authorize card if we haven't done that today
    final boolean authorized = state.get(AUTHORIZED).orElseGet(() -> {
      boolean success = Payments.authorizeCard(cardId);
      state.set(AUTHORIZED, success);

      if (!success) {
        // make call to status cache to block this card at the gates
        Restate.run("block card", () -> CardStatusServiceApi.tagCardAsBlocked(cardId));
      }

      return success;
    });
    if (!authorized) {
      return "BLOCKED";
    }

    // start this journey
    state.set(ONGOING_JOURNEY, station);

    // ensure this journey finishes by end of operations
    Restate.virtualObjectHandle(CardTracker.class, cardId)
        .send(CardTracker::finalizeAllJourneys, delayTillEndOfDay());

    return "OK";
  }

  @Handler
  public String badgeOut(String exitStation) {
    final String cardId = Restate.key();
    var state = Restate.state();

    final Optional<String> startingStation = state.get(ONGOING_JOURNEY);
    if (startingStation.isEmpty()) {
      return "BLOCKED";
    }
    state.clear(ONGOING_JOURNEY);

    final DailyFare fare = state.get(TOTAL_FARE_TODAY).orElseGet(DailyFare::new);
    final long tripPrice = fare.addTrip(startingStation.get(), exitStation);
    state.set(TOTAL_FARE_TODAY, fare);

    return tryCharge(cardId, tripPrice) ? "OK" : "BLOCKED";
  }

  @Handler
  public void finalizeAllJourneys() {
    var state = Restate.state();
    // Executes at the end of the day
    // If the card still has an ongoing journey, end it and charge the day ticket
    state.get(ONGOING_JOURNEY).ifPresent((String startStation) -> {
      String cardId = Restate.key();
      DailyFare fare = state.get(TOTAL_FARE_TODAY).orElseGet(DailyFare::new);
      long remainderToPay = fare.upgradeToDayTicket();
      tryCharge(cardId, remainderToPay);
      state.clear(ONGOING_JOURNEY);
    });

    state.clear(TOTAL_FARE_TODAY);
  }

  @Shared
  public boolean isBlocked() {
    return !Restate.state().get(AUTHORIZED).orElse(true);
  }

  @Handler
  public void unblock() {
    Restate.state().clear(AUTHORIZED);
  }

  private boolean tryCharge(String cardRef, long amountCents) {
    if (amountCents == 0) {
      return true;
    }
    boolean paymentSuccess = Payments.chargeCard(cardRef, amountCents);
    if (!paymentSuccess) {
      Restate.state().set(AUTHORIZED, false);
      Restate.run("block card", () -> CardStatusServiceApi.tagCardAsBlocked(cardRef));
    }
    return paymentSuccess;
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new CardTracker()));
  }
}
