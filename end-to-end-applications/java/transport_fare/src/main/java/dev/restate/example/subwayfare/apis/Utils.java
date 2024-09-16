package dev.restate.example.subwayfare.apis;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalUnit;
import java.util.TimeZone;
import java.util.concurrent.TimeUnit;

public final class Utils {

  public static void threadSleep(long millis) {
    try {
      Thread.sleep(millis);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }

  public static Duration threeAm() {
    final LocalTime threeAm = LocalTime.of(3, 0);

    final LocalDate dayOfEnd = LocalDateTime.now().getHour() < 3
        ? LocalDate.now()
        : LocalDate.now().plusDays(1);

    LocalDateTime endOfService = LocalDateTime.of(dayOfEnd, threeAm);
    final long millis = LocalDateTime.now().until(endOfService, ChronoUnit.MILLIS);
    return Duration.of(millis, ChronoUnit.MILLIS);
  }

  private Utils() {}
}
