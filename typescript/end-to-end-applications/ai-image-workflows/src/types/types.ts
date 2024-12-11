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

import {ServiceDefinition} from "@restatedev/restate-sdk";

export type WorkflowStep = {
    imgInputPath?: string;
    imgOutputPath?: string;
    service: string;
    parameters: any;
}

export type WorkflowDefinition = {
    id: string;
    steps: Array<WorkflowStep>;
}

export type WorfklowStatus = {
    status: string;
    output: string[];
    imgName: string;
}

export type router = { run: (wf: WorkflowStep) => Promise<ProcessorOutput>; }

// Any new workflow steps need to be added to this register
// Maybe another data structure would be better
export enum ProcessorType {
    SOURCE = "source",
    TRANSFORMER = "transformer"
}

export type WorkflowStepProcessor = {
    processorType: ProcessorType,
    api: ServiceDefinition<any, { run: (wf: WorkflowStep) => Promise<ProcessorOutput>; }>
}

export type ProcessorOutput = {
    msg: string;
    output: any;
}