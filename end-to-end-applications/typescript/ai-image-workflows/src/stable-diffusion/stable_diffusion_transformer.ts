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

import * as restate from "@restatedev/restate-sdk";
import { WorkflowStep } from "../types/types";
import axios from "axios";
import * as fs from "fs";
import Jimp from "jimp";

type StableDiffusionParams = { prompt: string, steps?: number }

export const router = restate.router({
    run: async (ctx: restate.Context, wf: WorkflowStep) => {
        const prompt = wf.parameters as { prompt: string };
        const image = await Jimp.read(wf.imgInputPath!)
        const base64EncodedImg = (await image.getBufferAsync(Jimp.MIME_PNG)).toString('base64')
        const stableDiffusionParams = { ...prompt, init_images: [base64EncodedImg] };

        console.info("Transforming image with stable diffusion with parameters: " + JSON.stringify(prompt))
        await transformImgWithStableDiffusion(ctx, wf.imgOutputPath!, stableDiffusionParams)

        return {
            msg: "[Transformed stable diffusion image with parameters: " + JSON.stringify(prompt) + "]",
        };
    }
})

async function transformImgWithStableDiffusion(ctx: restate.Context, imgOutputPath: string, params: StableDiffusionParams) {
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
export const service: restate.ServiceApi<api> = { path: "stable-diffusion-transformer" }