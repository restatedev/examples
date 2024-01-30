import * as restate from "@restatedev/restate-sdk";
import { WorkflowStep } from "../types/types";
import axios from "axios";
import * as fs from "fs";

type StableDiffusionParams = { prompt: string, steps?: number }

export const router = restate.router({
    run: async (ctx: restate.RpcContext, wf: WorkflowStep) => {
        const stableDiffusionParams = wf.parameters as StableDiffusionParams;

        console.info("Generating image with stable diffusion with parameters: " + JSON.stringify(stableDiffusionParams))
        await generateStableDiffusionImg(ctx, wf.imgOutputPath!, stableDiffusionParams);

        return {
            msg: "[Generated stable diffusion image with parameters: " + JSON.stringify(stableDiffusionParams) + "]",
        };
    }
})

async function generateStableDiffusionImg(ctx: restate.RpcContext, imgOutputPath: string, params: StableDiffusionParams) {
    const awakeable = ctx.awakeable<string>();

    await ctx.sideEffect(async () => {
        // invoke the stable diffusion service with our awakeable as callback
        await axios.post("http://localhost:5050/generate", { params: params, callback: awakeable.id });
    });

    // wait for the callback from the stable diffusion service containing the generated image
    const generatedImg = await awakeable.promise;

    const decodedImage: Buffer = Buffer.from(generatedImg, "base64");
    await ctx.sideEffect(async () => fs.writeFileSync(imgOutputPath, decodedImage));
}

export type api = typeof router;
export const service: restate.ServiceApi<api> = { path: "stable-diffusion-generator" }