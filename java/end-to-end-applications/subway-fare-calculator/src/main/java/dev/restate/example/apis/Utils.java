package dev.restate.example.apis;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

public final class Utils {

  public static void threadSleep(long millis) {
    try {
      Thread.sleep(millis);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }

  public static Duration delayTillEndOfDay() {
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
