package my.example.auxiliary.types;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public record PurchaseTicketRequest(
    String ticketId,
    String concertDateTime,
    BigDecimal price,
    String customerEmail
) {
    
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public long millisUntilConcert() {
        LocalDateTime dateTime = LocalDateTime.parse(concertDateTime, FORMATTER);
        return dateTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }
}
