package my.example.batcher;

import dev.restate.sdk.InvocationHandle;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.time.Duration;
import java.util.List;

@VirtualObject
public class Batcher {

    private static final Logger LOG = LogManager.getLogger(Batcher.class);

    private static final Duration MAX_BATCH_WAIT = Duration.ofSeconds(1);
    private static final int MAX_BATCH = 10;
    private static final StateKey<BatcherState> STATE = StateKey.of("state", BatcherState.class);

    record BatcherState(
            List<String> items,
            String expireInvocationId
    ) { }

    @Handler
    public void receive(ObjectContext ctx, String item) {
        ctx.get(STATE).ifPresentOrElse(state -> {
            LOG.info("Adding item {} to existing batch", item);

            state.items().add(item);
            if (state.items().size() == MAX_BATCH) {
                LOG.info("Sending batch as it reached {} items", MAX_BATCH);
                sendBatch(ctx, state.expireInvocationId(), state.items());
            } else {
                // write back updated state
                ctx.set(STATE, state);
            }
        }, () -> {
            LOG.info("Adding item to new batch, will send in at most {}", MAX_BATCH_WAIT);
            InvocationHandle<?> invocationId = BatcherClient.fromContext(ctx, ctx.key()).send().expire(MAX_BATCH_WAIT);
            ctx.set(STATE, new BatcherState(List.of(item), invocationId.invocationId()));
        });
    }

    @Handler
    public void expire(ObjectContext ctx) {
        var state = ctx.get(STATE).orElseThrow();
        LOG.info("Sending batch with {} items as the timer fired", state.items().size());
        sendBatch(ctx, null, state.items());
    }

    void sendBatch(ObjectContext ctx, String invocationId, List<String> items) {
        if (invocationId != null) {
            // cancel scheduled sending, since we are invoked due to item count
            ctx.invocationHandle(invocationId).cancel();
        }
        BatchReceiverClient.fromContext(ctx).receive(items);
        ctx.clearAll();
    }

    public static void main(String[] args) {
        RestateHttpServer.listen(Endpoint.bind(new Batcher()).bind(new BatchReceiver()));
    }
}
