package my.example.serde;

import com.stripe.model.PaymentIntent;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.Serde;
import my.example.utils.StripeUtils;

public class PaymentIntentSerde implements Serde<PaymentIntent> {

    StripeUtils stripe = new StripeUtils();

    @Override
    public byte[] serialize(PaymentIntent intent) {
        return CoreSerdes.JSON_STRING.serialize(intent.getId());
    }

    @Override
    public PaymentIntent deserialize(byte[] bytes) {
        return stripe.retrieve(CoreSerdes.JSON_STRING.deserialize(bytes));
    }
}
