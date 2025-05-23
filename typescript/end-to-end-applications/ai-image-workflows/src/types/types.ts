import { ImageFormat } from "puppeteer";

export type WorkflowStep = {
    imgInputPath?: string;
    imgOutputPath?: `${string}.${ImageFormat}`;
    action: string;
    parameters: any;
}

export type WorfklowStatus = {
    status: string;
    output: string[];
    imgName: string;
}

export enum ProcessorType {
    SOURCE = "source",
    TRANSFORMER = "transformer"
}

export type WorkflowStepProcessor = {
    type: ProcessorType,
    service: string,
    method: string
}