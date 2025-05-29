package my.example.parallelizework.utils;

import dev.restate.sdk.Context;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class Utils {

  private static final Logger logger = LogManager.getLogger(Utils.class);

  public static List<SubTask> split(Task task) {
    // Split the task into subTasks
    return Arrays.stream(task.description().split(",")).map(SubTask::new).toList();
  }

  public static SubTaskResult executeSubtask(Context ctx, SubTask subtask) {
    // Execute subtask
    logger.info("Started executing subtask: {}", subtask.description());
    // Sleep for a random amount between 0 and 5 seconds
    ctx.sleep(Duration.ofSeconds(ctx.random().nextInt(0, 10)));
    logger.info("Execution subtask finished: {}", subtask.description());
    return new SubTaskResult(subtask.description() + ": DONE");
  }

  public static Result aggregate(List<SubTaskResult> subResults) {
    // Aggregate the results
    String resultDescription =
        subResults.stream().map(SubTaskResult::description).collect(Collectors.joining(", "));

    logger.info("Aggregated result: {}", resultDescription);
    return new Result(resultDescription);
  }
}
