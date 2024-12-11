/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

import {ProcessorType, WorkflowStepProcessor} from "../types/types";
import * as puppeteer from "../puppeteer/puppeteer_generator";
import * as stableDiffusionGenerator from "../stable-diffusion/stable_diffusion_generator";
import * as rotateImgService from "../transformers/rotate_img_service";
import * as blurImgService from "../transformers/blur_img_service";
import * as stableDiffusionTransformer from "../stable-diffusion/stable_diffusion_transformer";

export const workflowStepRegistry = new Map<string, WorkflowStepProcessor>([
    //sources
    ["puppeteer-service", {processorType: ProcessorType.SOURCE, api: puppeteer.service} as WorkflowStepProcessor],
    ["stable-diffusion-generator", {processorType: ProcessorType.SOURCE, api: stableDiffusionGenerator.service} as WorkflowStepProcessor],

    //transformers
    ["rotate-img-service", {processorType: ProcessorType.TRANSFORMER, api: rotateImgService.service} as WorkflowStepProcessor],
    ["blur-img-service", {processorType: ProcessorType.TRANSFORMER, api: blurImgService.service} as WorkflowStepProcessor],
    ["stable-diffusion-transformer", {processorType: ProcessorType.TRANSFORMER, api: stableDiffusionTransformer.service} as WorkflowStepProcessor]
]);