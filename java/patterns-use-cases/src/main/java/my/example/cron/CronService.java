package my.example.cron;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;

@Service
public class CronService {
  @Handler
  public String create(Context ctx, CronJob.CronRequest req) {
    // Creates a job ID and waits for successful initiation of the job
    var jobId = ctx.random().nextUUID().toString();
    var cronJob = CronJobClient.fromContext(ctx, jobId).initiateJob(req).await();
    return "Job created with ID "
        + jobId
        + " and next execution time "
        + cronJob.nextExecutionTime();
  }
}
