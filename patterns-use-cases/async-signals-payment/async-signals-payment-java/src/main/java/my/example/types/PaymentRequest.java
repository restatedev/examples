package my.example.types;

public class PaymentRequest {
    private final Long amount;
    private final String paymentMethodId;
    private final boolean delayedStatus;

    public PaymentRequest(Long amount, String paymentMethodId, boolean delayedStatus) {
        this.amount = amount;
        this.paymentMethodId = paymentMethodId;
        this.delayedStatus = delayedStatus;
    }

    public Long getAmount() {
        return amount;
    }

    public String getPaymentMethodId() {
        return paymentMethodId;
    }

    public boolean isDelayed() {
        return delayedStatus;
    }
}
