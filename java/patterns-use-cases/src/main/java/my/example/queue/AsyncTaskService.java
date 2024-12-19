package my.example.queue;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;

@Service
public class AsyncTaskService {

    public record TaskOpts(String key, String taskName, String payload) {}

    @Handler
    public String runTask(Context ctx, TaskOpts params) {
        return someHeavyWork(params);
    }

    private String someHeavyWork(TaskOpts params) {
        return "someHeavyWork";
    }

    public static void main(String[] args) {
         RestateHttpEndpointBuilder.builder().bind(new AsyncTaskService()).buildAndListen();
    }
}
