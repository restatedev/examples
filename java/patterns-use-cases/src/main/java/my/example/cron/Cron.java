package my.example.cron;

import com.cronutils.model.CronType;
import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.model.time.ExecutionTime;
import com.cronutils.parser.CronParser;
import dev.restate.common.Request;
import dev.restate.common.Target;
import dev.restate.sdk.Context;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.SharedObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import dev.restate.serde.TypeTag;
import java.time.ZonedDateTime;
import java.util.Optional;

/*
A cron service that schedules tasks based on cron expressions.
It uses a cron expression parser to determine the next execution time and schedules the task accordingly.
The service allows you to create a cron job that can be started, executed, and canceled.
It also provides a way to retrieve information about the job, such as the next execution time and the ID of the next execution invocation.

The service can be used to schedule any handler in any service, including virtual objects if you supply the key.
Restate guarantees that the handler will be executed at the scheduled time.

Requests to start a new cron job need to be sent to the JobInitiator,
which creates a job ID and then initializes a new Job Object.

+-------------------+                     +---------------------------+
| CronJobInitiator  |                     | CronJob                   |
| - create()        | ----------------->  | - initiateJob()           |
|                   |                     | - execute()               |
|                   |                     | - cancel()                |
|                   |                     | - getInfo()               |
+-------------------+                     +---------------------------+
*/
public class Cron {

  public record CronRequest(
      String expr, // The cron expression e.g. "0 0 * * *" (every day at midnight)
      String service,
      String method, // Handler to execute with this schedule
      Optional<String> key, // Optional: Virtual Object key to call
      Optional<String> parameter) {} // Optional payload to pass to the handler

  public record CronJobSpec(
      CronRequest req,
      String nextExecutionTime, // The next execution time of the cron job
      String nextExecutionId) {} // The ID of the next execution invocation

  @Service
  public static class JobInitiator {
    @Handler
    public String create(Context ctx, CronRequest req) {
      // Creates a job ID and waits for successful initiation of the job
      var jobId = ctx.random().nextUUID().toString();
      var cronJob = CronJobClient.fromContext(ctx, jobId).initiateJob(req).await();
      return "Job created with ID "
          + jobId
          + " and next execution time "
          + cronJob.nextExecutionTime();
    }
  }

  @VirtualObject
  public static class Job {

    private final StateKey<CronJobSpec> JOB = StateKey.of("job", CronJobSpec.class);
    private final CronParser cronParser =
        new CronParser(CronDefinitionBuilder.instanceDefinitionFor(CronType.UNIX));

    @Handler
    public CronJobSpec initiateJob(ObjectContext ctx, CronRequest req) {
      // Check if the job already exists
      var job = ctx.get(JOB);
      if (job.isPresent()) {
        throw new TerminalException(
            "Job already exists. Use a different ID or cancel the existing job first.");
      }

      // starting the cron job the first time
      return scheduleNextExecution(ctx, req);
    }

    @Handler
    public void execute(ObjectContext ctx) {
      var task =
          ctx.get(JOB)
              .orElseThrow(() -> new TerminalException("No cron job information found."))
              .req;

      // Execute the task
      var target =
          (task.key.isPresent())
              ? Target.virtualObject(task.service, task.method, task.key.get())
              : Target.service(task.service, task.method);
      var request =
          (task.parameter.isPresent())
              ? Request.of(
                  target, TypeTag.of(String.class), TypeTag.of(Void.class), task.parameter.get())
              : Request.of(target, new byte[0]);
      ctx.send(request);

      scheduleNextExecution(ctx, task);
    }

    @Handler
    public void cancel(ObjectContext ctx) {
      // Cancel the cron job by canceling the next execution
      var job = ctx.get(JOB);
      if (job.isPresent()) {
        ctx.invocationHandle(job.get().nextExecutionId).cancel();
      }

      // Clear the job state
      ctx.clearAll();
    }

    @Shared
    public Optional<CronJobSpec> getInfo(SharedObjectContext ctx) {
      return ctx.get(JOB);
    }

    private CronJobSpec scheduleNextExecution(ObjectContext ctx, CronRequest req) {
      // Parse the cron expression to determine the next execution time
      // Persist current date in Restate for deterministic replay
      var now = ctx.run(ZonedDateTime.class, ZonedDateTime::now);

      ExecutionTime executionTime;
      try {
        executionTime = ExecutionTime.forCron(cronParser.parse(req.expr));
      } catch (IllegalArgumentException e) {
        throw new TerminalException("Invalid cron expression " + req.expr + ": " + e.getMessage());
      }

      // Get delay and next execution time
      var delay =
          executionTime
              .timeToNextExecution(now)
              .orElseThrow(() -> new TerminalException("No next cron execution time found."));
      var nextExecutionTime =
          executionTime
              .nextExecution(now)
              .orElseThrow(() -> new TerminalException("No next cron execution time found."));

      // Schedule the job to run at the next execution time
      var handle = CronJobClient.fromContext(ctx, ctx.key()).send().execute(delay);

      // Store the job spec in the context
      var job = new CronJobSpec(req, nextExecutionTime.toString(), handle.invocationId());
      ctx.set(JOB, job);
      return job;
    }
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(
        Endpoint.bind(new JobInitiator()).bind(new Job()).bind(new TaskService()));
  }
}
