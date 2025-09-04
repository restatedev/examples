package my.example.auxiliary.types;

public record PaymentRequest(
    int amount,
    String currency,
    String customerId,
    String orderId
) {}