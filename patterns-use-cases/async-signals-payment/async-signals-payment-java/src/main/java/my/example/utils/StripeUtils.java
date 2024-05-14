package my.example.utils;

import com.stripe.StripeClient;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.RequestOptions;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentIntentCreateParams.ConfirmationMethod;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.TerminalException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class StripeUtils {

    Logger logger = LogManager.getLogger(StripeUtils.class);
    private final String stripeSecretKey = "sk_test_...";
    private final String webhookSecret = "whsec_...";
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
            PaymentIntent paymentIntent = stripe.paymentIntents().create(
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
            logger.error("Payment error: " + err.getMessage());
            // Simulate delayed notifications for testing
            try {
                PaymentIntent paymentIntent = err.getStripeError().getPaymentIntent();
                if(delayedStatus) {
                    paymentIntent.setStatus("processing");
                    return paymentIntent;
                } else {
                    throw new TerminalException("Payment declined: " + paymentIntent.getStatus() + " - " + err.getMessage());
                }
            } catch (NullPointerException exc) {
                throw new TerminalException("Payment error: " + exc.getMessage());
            }
        }
    }

    public PaymentIntent retrieve(String id) {
        try {
            return stripe.paymentIntents().retrieve(id);
        } catch (StripeException e) {
            throw new RuntimeException(e);
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
