import * as restate from "@restatedev/restate-sdk";
import {WorkflowStep} from "./types/types";
import Jimp from "jimp";
import {TerminalError} from "@restatedev/restate-sdk";

export const transformerService = restate.service({
    name: "transformer",
    handlers: {
        rotate: async (ctx: restate.Context, wfStep: WorkflowStep) => {
            const { angle } = wfStep.parameters as { angle: number };
            ctx.console.info(`Rotating image with angle: ${angle}`);

            await ctx.run(async () => {
                const image = await getImage(wfStep.imgInputPath!);
                await image.rotate(angle).writeAsync(wfStep.imgOutputPath!);
            });

            return { msg: `[Rotated image with angle: ${angle}]` };
        },

        blur: async (ctx: restate.Context, wfStep: WorkflowStep) => {
            const { blur } = wfStep.parameters as { blur: number };
            ctx.console.info(`Blurring image with parameter ${blur}`);

            await ctx.run(async () => {
                const image = await getImage(wfStep.imgInputPath!);
                await image.blur(blur).writeAsync(wfStep.imgOutputPath!);
            });

            return {
                msg: `[Blurred image with strength param ${blur}]`
            };
        }
    }
})


function getImage(inputPath: string): Promise<Jimp> {
    try {
        return Jimp.read(inputPath);
    } catch (err) {
        throw new TerminalError("Error reading image: " + err)
    }
}