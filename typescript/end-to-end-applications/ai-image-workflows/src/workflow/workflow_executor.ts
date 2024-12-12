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

import { ProcessorType, WorfklowStatus, WorkflowDefinition, WorkflowStep } from "../types/types";
import * as restate from "@restatedev/restate-sdk";
import * as workflowStatus from "./workflow_status";
import { TerminalError } from "@restatedev/restate-sdk";
import { workflowStepRegistry } from "./workflow_step_registry";
import fs from 'fs';

export const service = restate.service({
    name: "workflow-executor",
    handlers: {
        execute: async (ctx: restate.Context, wfDefinition: WorkflowDefinition) => {
            validatedWorkflowDefinition(wfDefinition);

            // Generate a stable image storage path and add it to the workflow definition
            const imgName = ctx.rand.uuidv4();
            const wf = addImgPathToSteps(wfDefinition, imgName);

            let status = {status: "Processing", imgName, output: []} as WorfklowStatus;
            for (const step of wf.steps) {
                const result = await executeWorkflowStep(ctx, step);
                status.output.push(result.msg);

                ctx.objectSendClient(workflowStatus.service, wf.id).update(status);
            }

            status.status = "Finished";
            ctx.objectSendClient(workflowStatus.service, wf.id).update(status);
            return status;
        }
    }
})

// --------------------- Utils / helpers -------------------------------------

function validatedWorkflowDefinition(wfDefinition: WorkflowDefinition) {
    // Check if workflow definition has steps
    if (!wfDefinition.steps) {
        throw new TerminalError("Invalid workflow definition: no steps defined");
    }

    // Check if workflow steps are valid
    wfDefinition.steps.forEach(step => {
        if (!workflowStepRegistry.has(step.service)) {
            new TerminalError(`Invalid workflow definition: Service ${step.service} not found`)
        }
    })

    // First element needs to contain a image file path or be a source
    const firstStep = wfDefinition.steps[0];
    if (workflowStepRegistry.get(firstStep.service)!.processorType !== ProcessorType.SOURCE && !firstStep.imgInputPath) {
        throw new TerminalError(`Invalid workflow definition: First step must be a source or contain an image file path`)
    }

    // Other elements should be transformers
    wfDefinition.steps.slice(1).forEach(step => {
        if (workflowStepRegistry.get(step.service)!.processorType !== ProcessorType.TRANSFORMER) {
            throw new TerminalError(`Invalid workflow definition: Step ${step.service} must be a transformer`)
        }
    })

    return wfDefinition;
}

const outputDirectory = "generated-images";

function addImgPathToSteps(wfDefinition: WorkflowDefinition, imgName: string) {
    if (!fs.existsSync(outputDirectory)) {
        // ensure that the output directory exists
        fs.mkdirSync(outputDirectory);
    }

    const enrichedWfDefinition = { ...wfDefinition };
    enrichedWfDefinition.steps = wfDefinition.steps.map((step, index) => {
        // If it's the first step, and it already contains an input path then just take the raw input, otherwise take the output path of the previous step as input path
        const imgInputPath = index === 0 ? step.imgInputPath : `${outputDirectory}/${imgName}-${index - 1}.png`;
        return {
            ...step,
            imgInputPath: imgInputPath,
            imgOutputPath: `${outputDirectory}/${imgName}-${index}.png`
        }
    })
    return enrichedWfDefinition;
}

function executeWorkflowStep(ctx: restate.Context, step: WorkflowStep) {
    const servicePath = workflowStepRegistry.get(step.service)!;
    // @ts-ignore
    return ctx.serviceClient(servicePath.api).run(step);
}
