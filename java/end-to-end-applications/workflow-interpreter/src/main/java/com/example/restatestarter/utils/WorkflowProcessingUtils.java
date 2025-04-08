package com.example.restatestarter.utils;

import com.example.restatestarter.types.ProcessorType;
import com.example.restatestarter.types.WorkflowStep;
import com.example.restatestarter.types.WorkflowStepProcessor;
import dev.restate.sdk.common.TerminalException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class WorkflowProcessingUtils {

    private static final String OUTPUT_DIR = "generated-images";

    // This is a registry of all available workflow steps
    // Each of the JSON steps will be mapped to a processor in this registry
    public static final Map<String, WorkflowStepProcessor> workflowStepRegistry = new HashMap<>() {{
        put("puppeteer", new WorkflowStepProcessor(ProcessorType.SOURCE, "PuppeteerService", "run"));
        put("rotate", new WorkflowStepProcessor(ProcessorType.TRANSFORMER, "TransformerService", "rotate"));
        put("blur", new WorkflowStepProcessor(ProcessorType.TRANSFORMER, "TransformerService", "blur"));
    }};

    // This method returns the processor step from the registry
    public static WorkflowStepProcessor getProcessorStepFromRegistry(String action) {
        return workflowStepRegistry.get(action);
    }

    public static void validateWorkflowDefinition(List<WorkflowStep> wfSteps) {
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

    public static List<WorkflowStep> addImgPathToSteps(List<WorkflowStep> wfSteps, String imgName) throws IOException {
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
