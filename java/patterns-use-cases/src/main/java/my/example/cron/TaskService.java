package my.example.cron;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@Service
public class TaskService {
  private static final Logger logger = LogManager.getLogger(TaskService.class);

  /*
  This is a task stub to be able to demo the cron service.
  */
  @Handler
  public void executeTask(Context ctx, String task) {
    // Here you would implement the logic to execute the task
    // For example, you could call another service or perform some computation
    logger.info("Executing task with parameter: {}", task);
  }
}
