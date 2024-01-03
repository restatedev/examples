package dev.restate.sdk.examples.clients;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class PaymentClient {
    private static final Logger logger = LogManager.getLogger(PaymentClient.class);

    public static PaymentClient get(){
        return new PaymentClient();
    }

    public boolean reserve(String id, String token, double amount) {
        logger.info(String.format("[%s] Reserving payment with token %s for %.2f", id, token, amount));
        // do the call
        return true;
    }

    public boolean unreserve(String id, String token, double amount) {
        logger.info(String.format("[%s] Unreserving payment with token %s for %.2f", id, token, amount));
        // do the call
        return true;
    }

    public boolean charge(String id, String token, double amount) {
        logger.info(String.format("[%s] Executing payment with token %s for %.2f", id, token, amount));
        // do the call
        return true;
    }

}
