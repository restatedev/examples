package my.example.auxiliary;

import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;

public class Utils {

    public static Duration dayBefore(String concertDate) {
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
