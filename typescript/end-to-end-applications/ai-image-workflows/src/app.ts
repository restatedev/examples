import * as restate from "@restatedev/restate-sdk";
import { imageProcessingWorkflow } from "./image_processing_workflow";
import { transformerService } from "./transformer_service";
import { puppeteerService } from "./puppeteer_service";
import { stableDiffusion } from "./stable_diffusion";

restate.serve({
  services: [imageProcessingWorkflow, transformerService, puppeteerService, stableDiffusion],
  port: 9080,
});
