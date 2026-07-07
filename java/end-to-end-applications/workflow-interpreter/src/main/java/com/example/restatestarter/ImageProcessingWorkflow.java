package com.example.restatestarter;

import com.example.restatestarter.types.WorkflowStatus;
import com.example.restatestarter.types.WorkflowStep;
import com.example.restatestarter.types.WorkflowStepProcessor;
import dev.restate.common.Target;
import dev.restate.common.Request;
import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.springboot.RestateComponent;
import dev.restate.sdk.common.StateKey;
import dev.restate.serde.TypeTag;

import java.util.*;

import static com.example.restatestarter.utils.WorkflowProcessingUtils.*;

@RestateComponent
@Workflow
public class ImageProcessingWorkflow {

  private static final StateKey<WorkflowStatus> STATUS =
          StateKey.of("status", WorkflowStatus.class);

  @Workflow
  public WorkflowStatus run(List<WorkflowStep> wfSteps) throws Exception {
    validateWorkflowDefinition(wfSteps);

    String imgName = Restate.random().nextUUID().toString();
    // Add the image input and output names for each step (uuid + step number)
    List<WorkflowStep> enrichedWfSteps = addImgPathToSteps(wfSteps, imgName);

    var state = Restate.state();
    WorkflowStatus status = new WorkflowStatus("Processing", imgName, Collections.emptyList());
    state.set(STATUS, status);

    for (WorkflowStep step : enrichedWfSteps) {
      WorkflowStepProcessor processor = getProcessorStepFromRegistry(step.action());
      String result = Restate.call(
          Request.of(
              Target.service(processor.service(), processor.method()),
              TypeTag.of(WorkflowStep.class),
              TypeTag.of(String.class),
              step
          )
      ).await();
      status = status.withNewOutput(result);
      state.set(STATUS, status);
    }

    status = status.withStatus("Finished");
    state.set(STATUS, status);
    return status;
  }
}
