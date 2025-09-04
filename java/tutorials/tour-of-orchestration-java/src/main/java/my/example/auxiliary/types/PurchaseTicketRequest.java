package my.example.auxiliary.types;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public record PurchaseTicketRequest(
        String ticketId, String concertDate, BigDecimal price, String customerEmail) {

  private static final DateTimeFormatter FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  public Duration dayBefore() {
    try {
      // Parse the concert date string into a ZonedDateTime (assuming it's in ISO format)
      ZonedDateTime concertDateTime = ZonedDateTime.parse(concertDate);
      long concertTimeMillis = concertDateTime.toInstant().toEpochMilli();

      long now = Instant.now().toEpochMilli();

      long oneDayMillis = 24 * 60 * 60 * 1000;
      long delay = concertTimeMillis - now - oneDayMillis;

      if (delay < 0) {
        System.err.println("Reminder date is in the past, cannot schedule reminder.");
        return Duration.ofMillis(0); // No delay if the concert is already over
      }

      System.out.println("Scheduling reminder for " + concertDate + " with delay " + delay + "ms");
      return Duration.ofMillis(delay);

    } catch (DateTimeParseException e) {
      System.err.println("Invalid date format: " + concertDate);
      return Duration.ofMillis(0);
    }
  }
}
