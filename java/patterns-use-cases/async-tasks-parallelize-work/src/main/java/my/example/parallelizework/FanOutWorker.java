package my.example.parallelizework;

import com.fasterxml.jackson.core.type.TypeReference;
import dev.restate.sdk.Awaitable;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import java.util.ArrayList;
import java.util.List;

import static my.example.parallelizework.utils.DataProcessingUtils.aggregate;
import static my.example.parallelizework.utils.DataProcessingUtils.split;

/*
 * Restate makes it easy to parallelize async work by fanning out tasks.
 * Afterwards, you can collect the result by fanning in the partial results.
 * Durable Execution ensures that the fan-out and fan-in steps happen reliably exactly once.
 */
@Service
public class FanOutWorker {

  public record Task(){}
  public record SubTask(){}
  public record SubTaskResult(){}
  public record Result(){}

  @Handler
  public Result run(Context ctx, Task task) {
    // Split the task in subtasks
    List<SubTask> subTasks = ctx.run(JacksonSerdes.of(new TypeReference<>() {}),
            () -> split(task));

    // Fan out the subtasks - run them in parallel
    List<Awaitable<?>> resultFutures = new ArrayList<>();
    for (SubTask subTask : subTasks) {
      resultFutures.add(FanOutWorkerClient.fromContext(ctx).runSubtask(subTask));
    }

    Awaitable.all(resultFutures).await();

    // Fan in - Aggregate the results
    var results = (SubTaskResult[]) resultFutures.stream().map(Awaitable::await).toArray();
    return aggregate(results);
  }

  // Can also run on FaaS
  @Handler
  public SubTaskResult runSubtask(Context ctx, SubTask subTask) {
    // Processing logic goes here ...
    // Can be moved to a separate service to scale independently
    return new SubTaskResult();
  }

  public static void main(String[] args) {
     RestateHttpEndpointBuilder.builder().bind(new FanOutWorker()).buildAndListen(9082);
  }
}
