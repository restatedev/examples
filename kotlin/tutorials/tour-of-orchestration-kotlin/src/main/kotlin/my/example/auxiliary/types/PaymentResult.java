package my.example.auxiliary.types;

public record PaymentResult(
    boolean success,
    String transactionId,
    String errorMessage
) {}