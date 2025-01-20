package com.example.restatestarter;

import com.example.restatestarter.types.WorkflowStatus;
import com.example.restatestarter.types.WorkflowStep;
import com.example.restatestarter.types.WorkflowStepProcessor;
import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.Target;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.sdk.springboot.RestateWorkflow;

import java.util.*;

import static com.example.restatestarter.utils.WorkflowProcessingUtils.*;

@RestateWorkflow
public class ImageProcessingWorkflow {

  private static final StateKey<WorkflowStatus> STATUS =
          StateKey.of("status", JacksonSerdes.of(WorkflowStatus.class));

  @Workflow
  public WorkflowStatus run(WorkflowContext ctx, List<WorkflowStep> wfSteps) throws Exception {
    validateWorkflowDefinition(wfSteps);

    String imgName = ctx.random().nextUUID().toString();
    // Add the image input and output names for each step (uuid + step number)
    List<WorkflowStep> enrichedWfSteps = addImgPathToSteps(wfSteps, imgName);

    WorkflowStatus status = new WorkflowStatus("Processing", imgName, new ArrayList<>());
    ctx.set(STATUS, status);

    for (WorkflowStep step : enrichedWfSteps) {
      WorkflowStepProcessor processor = getProcessorStepFromRegistry(step.action());
      String result = ctx.call(
              Target.service(processor.service(), processor.method()),
              JacksonSerdes.of(WorkflowStep.class),
              JsonSerdes.STRING,
              step
      ).await();
      status.addToOutput(result);
      ctx.set(STATUS, status);
    }

    status.setStatus("Finished");
    ctx.set(STATUS, status);
    return status;
  }
}