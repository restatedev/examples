package my.example.parallelizework;

import dev.restate.sdk.Context;
import dev.restate.sdk.DurableFuture;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import dev.restate.serde.TypeRef;
import my.example.parallelizework.utils.Result;
import my.example.parallelizework.utils.SubTask;
import my.example.parallelizework.utils.SubTaskResult;
import my.example.parallelizework.utils.Task;

import java.util.ArrayList;
import java.util.List;

import static my.example.parallelizework.utils.Utils.*;

/*
 * Restate makes it easy to parallelize async work by fanning out tasks.
 * Afterward, you can collect the result by fanning in the partial results.
 *          +------------+
 *          | Split task |
 *          +------------+
 *                |
 *        ---------------------------------
 *        |                |              |
 * +--------------+ +--------------+ +--------------+
 * | Exec subtask | | Exec subtask | | Exec subtask |
 * +--------------+ +--------------+ +--------------+
 *        |                |               |
 *        ---------------------------------
 *                |
 *          +------------+
 *          | Aggregate  |
 *          +------------+
 * Durable Execution ensures that the fan-out and fan-in steps happen reliably exactly once.
*/

@Service
public class FanOutWorker {

  @Handler
  public Result run(Context ctx, Task task) {
    // Split the task in subtasks
    List<SubTask> subTasks = ctx.run(new TypeRef<>() {}, () -> split(task));

    // Fan out the subtasks - run them in parallel
    List<DurableFuture<?>> resultFutures = new ArrayList<>();
    for (SubTask subTask : subTasks) {
      resultFutures.add(FanOutWorkerClient.fromContext(ctx).runSubtask(subTask));
    }

    DurableFuture.all(resultFutures).await();

    // Fan in - Aggregate the results
    var results = resultFutures.stream()
            .map(future -> (SubTaskResult) future.await())
            .toList();
    return aggregate(results);
  }

  // Can also run on FaaS
  @Handler
  public SubTaskResult runSubtask(Context ctx, SubTask subTask) {
    // Processing logic goes here ...
    // Can be moved to a separate service to scale independently
    return executeSubtask(ctx, subTask);
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new FanOutWorker()));
  }
}
