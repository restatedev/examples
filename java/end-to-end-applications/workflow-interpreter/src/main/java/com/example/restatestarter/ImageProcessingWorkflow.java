package com.example.restatestarter;

import com.example.restatestarter.types.WorkflowStatus;
import com.example.restatestarter.types.WorkflowStep;
import com.example.restatestarter.types.WorkflowStepProcessor;
import dev.restate.common.Target;
import dev.restate.common.Request;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.springboot.RestateWorkflow;
import dev.restate.sdk.common.StateKey;
import dev.restate.serde.TypeTag;

import java.util.*;

import static com.example.restatestarter.utils.WorkflowProcessingUtils.*;

@RestateWorkflow
public class ImageProcessingWorkflow {

  private static final StateKey<WorkflowStatus> STATUS =
          StateKey.of("status", WorkflowStatus.class);

  @Workflow
  public WorkflowStatus run(WorkflowContext ctx, List<WorkflowStep> wfSteps) throws Exception {
    validateWorkflowDefinition(wfSteps);

    String imgName = ctx.random().nextUUID().toString();
    // Add the image input and output names for each step (uuid + step number)
    List<WorkflowStep> enrichedWfSteps = addImgPathToSteps(wfSteps, imgName);

    WorkflowStatus status = new WorkflowStatus("Processing", imgName, Collections.emptyList());
    ctx.set(STATUS, status);

    for (WorkflowStep step : enrichedWfSteps) {
      WorkflowStepProcessor processor = getProcessorStepFromRegistry(step.action());
      String result = ctx.call(
          Request.of(
              Target.service(processor.service(), processor.method()),
              TypeTag.of(WorkflowStep.class),
              TypeTag.of(String.class),
              step
          )
      ).await();
      status = status.withNewOutput(result);
      ctx.set(STATUS, status);
    }

    status = status.withStatus("Finished");
    ctx.set(STATUS, status);
    return status;
  }
}