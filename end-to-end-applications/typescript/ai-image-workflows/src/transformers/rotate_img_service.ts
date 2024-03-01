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
import {WorkflowStep} from "../types/types";
import Jimp from "jimp";
import {TerminalError} from "@restatedev/restate-sdk";

export const router = restate.router({
    run: async (ctx: restate.Context, wfStep: WorkflowStep) => {
        const rotateParams = wfStep.parameters as { angle: number };
        console.info("Rotating image with parameters: " + JSON.stringify(rotateParams))

        // we don't want to retry this too often, because failures here are most likely
        // terminal (path issues, etc.), so limit the reties to 5
        const retrySettings = {
            initialDelayMs: 100,
            maxRetries: 5,
            name: "image blurring"
        };

        await ctx.sideEffect(async () => {
            let image;
            try {
                image = await Jimp.read(wfStep.imgInputPath!);
            } catch (err) {
                throw new TerminalError("Error reading image: " + err)
            }
            const rotatedImg = image.rotate(rotateParams.angle);
            await rotatedImg.writeAsync(wfStep.imgOutputPath!)
        }, retrySettings);

        return {
            msg: "[Rotated image with parameters: " + JSON.stringify(rotateParams) + "]"
        };
    }
})


export type api = typeof router;
export const service: restate.ServiceApi<api> = { path: "rotate-img-service"} // the name of the service that serves the handlers
