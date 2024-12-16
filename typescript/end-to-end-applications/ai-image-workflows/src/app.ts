import * as restate from "@restatedev/restate-sdk";
import {imageProcessingWorkflow} from "./image_processing_workflow";
import {transformerService} from "./transformer_service";
import {puppeteerService} from "./puppeteer_service";

restate
    .endpoint()
    .bind(imageProcessingWorkflow)
    .bind(transformerService)
    .bind(puppeteerService)
    .listen(9080);