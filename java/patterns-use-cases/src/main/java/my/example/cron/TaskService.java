package my.example.cron;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
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
    logger.info("Executing task with payload: {}", task);
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(
        Endpoint.bind(new Cron.JobInitiator()).bind(new Cron.Job()).bind(new TaskService()));
  }
}
