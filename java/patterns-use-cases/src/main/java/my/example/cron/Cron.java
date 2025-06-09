package my.example.cron;

import static com.cronutils.model.CronType.UNIX;

import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.model.time.ExecutionTime;
import com.cronutils.parser.CronParser;
import dev.restate.common.Request;
import dev.restate.common.Target;
import dev.restate.sdk.Context;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.SharedObjectContext;
import dev.restate.sdk.annotation.*;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.serde.TypeTag;
import java.time.ZonedDateTime;
import java.util.Optional;

/*
 * A distributed cron service built with Restate that schedules tasks based on cron expressions.
 *
 * Features:
 * - Create cron jobs with standard cron expressions (e.g., "0 0 * * *" for daily at midnight)
 * - Schedule any Restate service handler or virtual object method
 * - Guaranteed execution with Restate's durability
 * - Cancel and inspect running jobs
 *
 * Usage:
 * 1. Send requests to CronInitiator.create() to start new jobs
 * 2. Each job gets a unique ID and runs as a CronJob virtual object
 * 3. Jobs automatically reschedule themselves after each execution
 */
public class Cron {

  public record JobRequest(
      String cronExpression, // e.g. "0 0 * * *" (every day at midnight)
      String service,
      String method, // Handler to execute with this schedule
      Optional<String> key, // Optional Virtual Object key to call
      Optional<String> payload) {} // Optional data to pass to the handler

  public record JobInfo(JobRequest req, String nextExecutionTime, String nextExecutionId) {}

  @Name("CronJobInitiator")
  @Service
  public static class JobInitiator {
    @Handler
    public String create(Context ctx, JobRequest req) {
      var jobId = ctx.random().nextUUID().toString();
      var cronJob = CronJobClient.fromContext(ctx, jobId).initiate(req).await();
      return String.format(
          "Job created with ID %s and next execution time %s", jobId, cronJob.nextExecutionTime());
    }
  }

  @Name("CronJob")
  @VirtualObject
  public static class Job {

    private final StateKey<JobInfo> JOB = StateKey.of("job", JobInfo.class);
    private final CronParser PARSER =
        new CronParser(CronDefinitionBuilder.instanceDefinitionFor(UNIX));

    @Handler
    public JobInfo initiate(ObjectContext ctx, JobRequest req) {
      if (ctx.get(JOB).isPresent()) {
        throw new TerminalException("Job already exists for this ID");
      }
      return scheduleNextExecution(ctx, req);
    }

    @Handler
    public void execute(ObjectContext ctx) {
      JobRequest req = ctx.get(JOB).orElseThrow(() -> new TerminalException("Job not found")).req;

      executeTask(ctx, req);
      scheduleNextExecution(ctx, req);
    }

    @Shared
    public void cancel(SharedObjectContext ctx) {
      JobInfo job = ctx.get(JOB)
                      .orElseThrow(() -> new TerminalException("Job not found"));
      ctx.invocationHandle(job.nextExecutionId).cancel();
      CronJobClient.fromContext(ctx, ctx.key()).send().cleanup();
    }

    @Handler
    public void cleanup(ObjectContext ctx) {
      ctx.clearAll();
    }

    @Shared
    public Optional<JobInfo> getInfo(SharedObjectContext ctx) {
      return ctx.get(JOB);
    }

    private void executeTask(ObjectContext ctx, JobRequest job) {
      Target target =
          (job.key.isPresent())
              ? Target.virtualObject(job.service, job.method, job.key.get())
              : Target.service(job.service, job.method);
      var request =
          (job.payload.isPresent())
              ? Request.of(
                  target, TypeTag.of(String.class), TypeTag.of(Void.class), job.payload.get())
              : Request.of(target, new byte[0]);
      ctx.send(request);
    }

    private JobInfo scheduleNextExecution(ObjectContext ctx, JobRequest req) {
      // Parse cron expression
      ExecutionTime executionTime;
      try {
        executionTime = ExecutionTime.forCron(PARSER.parse(req.cronExpression));
      } catch (IllegalArgumentException e) {
        throw new TerminalException("Invalid cron expression: " + e.getMessage());
      }

      // Calculate next execution time
      var now = ctx.run(ZonedDateTime.class, ZonedDateTime::now);
      var delay =
          executionTime
              .timeToNextExecution(now)
              .orElseThrow(() -> new TerminalException("Cannot determine next execution time"));
      var next =
          executionTime
              .nextExecution(now)
              .orElseThrow(() -> new TerminalException("Cannot determine next execution time"));

      // Schedule next execution
      var handle = CronJobClient.fromContext(ctx, ctx.key()).send().execute(delay);

      // Save job state
      var job = new JobInfo(req, next.toString(), handle.invocationId());
      ctx.set(JOB, job);
      return job;
    }
  }
}
