package utils;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;

@VirtualObject
public class SubscriptionService {

    @Handler
    public String create(ObjectContext ctx, String userId) {
        // Implementation here
        return "SUCCESS";
    }

    @Handler
    public void cancel(ObjectContext ctx) {
        System.out.println("Cancelling all subscriptions for user " + ctx.key());
    }
}