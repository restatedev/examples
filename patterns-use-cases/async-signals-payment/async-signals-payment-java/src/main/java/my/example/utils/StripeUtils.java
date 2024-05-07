package my.example.utils;

import com.stripe.StripeClient;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.RequestOptions;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentIntentCreateParams.ConfirmationMethod;
import dev.restate.sdk.common.TerminalException;

public class StripeUtils {

    private final String stripeSecretKey = "...";
    private final String webhookSecret = "...";
    private final StripeClient stripe;

    public StripeUtils (){
        stripe = StripeClient.builder()
                .setApiKey(stripeSecretKey)
                .build();
    }

    public PaymentIntent createPaymentIntent(
            String paymentMethodId,
            Long amount,
            String idempotencyKey,
            String webhookPromiseId
    ){
        return createPaymentIntent(
                paymentMethodId,
                amount,
                idempotencyKey,
                webhookPromiseId,
                false
        );
    }

    public PaymentIntent createPaymentIntent(
            String paymentMethodId,
            Long amount,
            String idempotencyKey,
            String webhookPromiseId,
            boolean delayedStatus
    ){

        try {
            PaymentIntent paymentIntent = PaymentIntent.create(
                    new PaymentIntentCreateParams.Builder()
                            .setPaymentMethod(paymentMethodId)
                            .setAmount(amount)
                            .setCurrency("USD")
                            .setConfirm(true)
                            .setConfirmationMethod(ConfirmationMethod.AUTOMATIC)
                            .setReturnUrl("https://restate.dev/")
                            .build(),
                    RequestOptions.builder()
                            .setIdempotencyKey(idempotencyKey)
                            .build()
            );

            if(delayedStatus){
                paymentIntent.setStatus("processing");
            }

            return paymentIntent;
        } catch (StripeException err) {
            // Simulate delayed notifications for testing
            PaymentIntent paymentIntent = err.getStripeError().getPaymentIntent();
            if(delayedStatus) {
                paymentIntent.setStatus("processing");
                return paymentIntent;
            } else {
                throw new TerminalException("Payment declined: " + paymentIntent.getStatus() + " - " + err.getMessage());
            }
        }
    }

    public Event parseWebhookCall(
            byte[] requestBody,
            String signature
    ){
        if(signature == null) {
            throw new TerminalException(400, "Missing 'stripe-signature' header");
        }

        try {
            return stripe.constructEvent(new String(requestBody), signature, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new TerminalException(400, "Webhook error: " + e.getMessage());
        }
    }
}
