package com.example.restatestarter;

import com.example.restatestarter.types.ProcessorType;
import com.example.restatestarter.types.WorkflowStatus;
import com.example.restatestarter.types.WorkflowStep;
import com.example.restatestarter.types.WorkflowStepProcessor;
import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.Target;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.sdk.springboot.RestateWorkflow;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;

@RestateWorkflow
public class ImageProcessingWorkflow {

  private static final String OUTPUT_DIR = "generated-images";

  private static final Map<String, WorkflowStepProcessor> workflowStepRegistry = new HashMap<>() {{
    put("puppeteer", new WorkflowStepProcessor(ProcessorType.SOURCE, "PuppeteerService", "run"));
    put("rotate", new WorkflowStepProcessor(ProcessorType.TRANSFORMER, "TransformerService", "rotate"));
    put("blur", new WorkflowStepProcessor(ProcessorType.TRANSFORMER, "TransformerService", "blur"));
  }};

  private static final StateKey<WorkflowStatus> STATUS = StateKey.of("status", JacksonSerdes.of(WorkflowStatus.class));

  @Workflow
  public WorkflowStatus run(WorkflowContext ctx, List<WorkflowStep> wfSteps) throws Exception {
    validateWorkflowDefinition(wfSteps);

    String imgName = ctx.random().nextUUID().toString();
    // Add the image input and output names for each step (uuid + step number)
    List<WorkflowStep> enrichedWfSteps = addImgPathToSteps(wfSteps, imgName);

    WorkflowStatus status = new WorkflowStatus("Processing", imgName, new ArrayList<>());
    ctx.set(STATUS, status);

    for (WorkflowStep step : enrichedWfSteps) {
      WorkflowStepProcessor processor = workflowStepRegistry.get(step.action());
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

  private void validateWorkflowDefinition(List<WorkflowStep> wfSteps) {
    if (wfSteps == null || wfSteps.isEmpty()) {
      throw new TerminalException("Invalid workflow definition: no steps defined");
    }

    for (WorkflowStep step : wfSteps) {
      if (!workflowStepRegistry.containsKey(step.action())) {
        throw new TerminalException("Invalid workflow definition: Service " + step.action() + " not found");
      }
      if (step.parameters() == null) {
        throw new TerminalException("Invalid workflow definition: Step " + step.action() + " must contain parameters");
      }
    }

    WorkflowStep firstStep = wfSteps.get(0);
    if (workflowStepRegistry.get(firstStep.action()).type() != ProcessorType.SOURCE && firstStep.imgInputPath() == null) {
      throw new TerminalException("Invalid workflow definition: First step must be a source or contain an image file path");
    }

    for (WorkflowStep step : wfSteps.subList(1, wfSteps.size())) {
      if (workflowStepRegistry.get(step.action()).type() != ProcessorType.TRANSFORMER) {
        throw new TerminalException("Invalid workflow definition: Step " + step.action() + " must be a transformer");
      }
    }
  }

  private List<WorkflowStep> addImgPathToSteps(List<WorkflowStep> wfSteps, String imgName) throws IOException {
    if (!Files.exists(Paths.get(OUTPUT_DIR))) {
      Files.createDirectory(Paths.get(OUTPUT_DIR));
    }

    List<WorkflowStep> enrichedSteps = new ArrayList<>();
    for (int i = 0; i < wfSteps.size(); i++) {
      WorkflowStep step = wfSteps.get(i);
      String imgInputPath = (i == 0) ? step.imgInputPath() : OUTPUT_DIR + "/" + imgName + "-" + (i - 1) + ".png";
      enrichedSteps.add(new WorkflowStep(
              imgInputPath,
              OUTPUT_DIR + "/" + imgName + "-" + i + ".png",
              step.action(),
              step.parameters()
      ));
    }
    return enrichedSteps;
  }
}