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

export const service = restate.service({
    name: "rotate-img-service",
    handlers : {
        run: async (ctx: restate.Context, wfStep: WorkflowStep) => {
            const rotateParams = wfStep.parameters as { angle: number };
            console.info("Rotating image with parameters: " + JSON.stringify(rotateParams))

            await ctx.run(async () => {
                let image;
                try {
                    image = await Jimp.read(wfStep.imgInputPath!);
                } catch (err) {
                    throw new TerminalError("Error reading image: " + err)
                }
                const rotatedImg = image.rotate(rotateParams.angle);
                await rotatedImg.writeAsync(wfStep.imgOutputPath!)
            });

            return {
                msg: "[Rotated image with parameters: " + JSON.stringify(rotateParams) + "]"
            };
        }
    }
})