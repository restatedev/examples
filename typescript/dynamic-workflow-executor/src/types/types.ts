import {ServiceApi} from "@restatedev/restate-sdk";

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
    api: ServiceApi<router>
}

export type ProcessorOutput = {
    msg: string;
    output: any;
}