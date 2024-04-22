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
    name: "blur-image-service",
    handlers: {
        run: async (ctx: restate.Context, wfStep: WorkflowStep) => {
            const blurParams = wfStep.parameters as { blur: number };
            console.info("Blurring image with parameters: " + JSON.stringify(blurParams))

            await ctx.run(async () => {
                let image;
                try {
                    image = await Jimp.read(wfStep.imgInputPath!);
                } catch (err) {
                    throw new TerminalError("Error reading image: " + err)
                }
                const blurredImg = image.blur(blurParams.blur);
                await blurredImg.writeAsync(wfStep.imgOutputPath!)
            });

            return {
                msg: "[Blurred image with parameters: " + JSON.stringify(blurParams) + "]"
            };
        }
    }
})