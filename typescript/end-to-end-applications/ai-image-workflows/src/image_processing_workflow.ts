import { ProcessorType, WorfklowStatus, WorkflowStep, WorkflowStepProcessor } from "./types/types";
import * as restate from "@restatedev/restate-sdk";
import { TerminalError } from "@restatedev/restate-sdk";
import fs from "fs";

const OUTPUT_DIR = "generated-images";

const workflowStepRegistry = new Map<string, WorkflowStepProcessor>([
  //sources
  ["puppeteer", { type: ProcessorType.SOURCE, service: "puppeteer-service", method: "run" }],
  [
    "stable-diffusion-generator",
    { type: ProcessorType.SOURCE, service: "stable-diffusion", method: "generate" },
  ],

  //transformers
  ["rotate", { type: ProcessorType.TRANSFORMER, service: "transformer", method: "rotate" }],
  ["blur", { type: ProcessorType.TRANSFORMER, service: "transformer", method: "blur" }],
  [
    "stable-diffusion-transformer",
    { type: ProcessorType.TRANSFORMER, service: "stable-diffusion", method: "transform" },
  ],
]);

export const imageProcessingWorkflow = restate.workflow({
  name: "image-processing-workflow",
  handlers: {
    run: async (ctx: restate.WorkflowContext, wfSteps: WorkflowStep[]) => {
      validateWorkflowDefinition(wfSteps);

      // Generate a stable image storage path and add it to the workflow definition
      const imgName = ctx.rand.uuidv4();
      const enrichedWfSteps = addImgPathToSteps(wfSteps, imgName);

      // Execute the workflow steps as defined in the input JSON definition
      let status = { status: "Processing", imgName, output: [] } as WorfklowStatus;
      for (const step of enrichedWfSteps) {
        const { service, method } = workflowStepRegistry.get(step.action)!;
        const result = await ctx.genericCall<WorkflowStep, string>({
          service,
          method,
          parameter: step,
          inputSerde: restate.serde.json,
          outputSerde: restate.serde.json,
        });
        status.output.push(result);
        ctx.set("status", status);
      }

      status.status = "Finished";
      ctx.set("status", status);
      return status;
    },

    getStatus: (ctx: restate.WorkflowSharedContext) =>
      ctx.get<WorfklowStatus>("status") ?? { status: "Not started" },
  },
});

// --------------------- Utils / helpers -------------------------------------

function validateWorkflowDefinition(wfSteps: WorkflowStep[]) {
  // Check if workflow definition has steps
  if (!Array.isArray(wfSteps) || wfSteps.length === 0) {
    throw new TerminalError("Invalid workflow definition: no steps defined");
  }

  // Check if workflow steps are valid
  wfSteps.forEach((step) => {
    if (!workflowStepRegistry.has(step.action)) {
      new TerminalError(`Invalid workflow definition: Service ${step.action} not found`);
    }
    if (!step.parameters) {
      throw new TerminalError(
        `Invalid workflow definition: Step ${step.action} must contain parameters`,
      );
    }
  });

  // First element needs to contain an image file path or be a source
  const firstStep = wfSteps[0];
  if (
    workflowStepRegistry.get(firstStep.action)!.type !== ProcessorType.SOURCE &&
    !firstStep.imgInputPath
  ) {
    throw new TerminalError(
      `Invalid workflow definition: First step must be a source or contain an image file path`,
    );
  }

  // Other elements should be transformers
  wfSteps.slice(1).forEach((step) => {
    if (workflowStepRegistry.get(step.action)!.type !== ProcessorType.TRANSFORMER) {
      throw new TerminalError(
        `Invalid workflow definition: Step ${step.action} must be a transformer`,
      );
    }
  });

  return wfSteps;
}

function addImgPathToSteps(wfSteps: WorkflowStep[], imgName: string) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    // ensure that the output directory exists
    fs.mkdirSync(OUTPUT_DIR);
  }

  return wfSteps.map((step, index) => {
    // If it's the first step, and it already contains an input path then just take the raw input, otherwise take the output path of the previous step as input path
    const imgInputPath =
      index === 0 ? step.imgInputPath : (`${OUTPUT_DIR}/${imgName}-${index - 1}.png` as const);
    return {
      ...step,
      imgInputPath: imgInputPath,
      imgOutputPath: `${OUTPUT_DIR}/${imgName}-${index}.png`,
    } as const;
  });
}
