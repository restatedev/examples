package my.example.timers;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.common.TimeoutException;
import my.example.auxiliary.types.ConfirmationRequest;
import my.example.auxiliary.types.PaymentRequest;
import my.example.auxiliary.types.PaymentResult;

import java.time.Duration;

import static my.example.auxiliary.clients.PaymentClient.initPayment;
import static my.example.auxiliary.clients.PaymentClient.cancelPayment;

@Service
public class PaymentsWithTimeoutService {

    @Handler
    public PaymentResult process(Context ctx, PaymentRequest req) {
        var confirmation = ctx.awakeable(PaymentResult.class);

        String payRef = ctx.run(
                "pay",
                String.class,
                () -> initPayment(req, confirmation.id()));

        try {
            return confirmation.await(Duration.ofSeconds(30));
        } catch (TimeoutException e) {
            ctx.run("cancel-payment", () -> cancelPayment(payRef));
            return new PaymentResult(
                    false,
                    null,
                    "Payment timeout"
            );
        }
    }

    @Handler
    public void confirm(Context ctx, ConfirmationRequest confirmation) {
        ctx.awakeableHandle(confirmation.id()).resolve(PaymentResult.class, confirmation.result());
    }

}