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

import * as puppeteer from 'puppeteer';
import * as restate from "@restatedev/restate-sdk";
import { WorkflowStep } from "../types/types";

type PuppeteerParams = { url: string, viewport?: { width?: number, height?: number } }

export const service = restate.service({
    name: "puppeteer-service",
    handlers: {
        run: async (ctx: restate.Context, wf: WorkflowStep) => {
            const puppeteerParams = wf.parameters as PuppeteerParams;

            console.info("Taking screenshot of website with parameters: " + JSON.stringify(puppeteerParams))
            await ctx.run(async () => takeWebsiteScreenshot(ctx, wf.imgOutputPath!, puppeteerParams));

            return {
                msg: "[Took screenshot of website with parameters: " + JSON.stringify(puppeteerParams) + "]",
            };
        }
    }
})

async function takeWebsiteScreenshot(ctx: restate.Context, imgOutputPath: string, params: PuppeteerParams) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: params.viewport?.width ?? 1388, height: params.viewport?.height ?? 800 });
    await page.goto(params.url);
    await page.screenshot({
        path: imgOutputPath
    });
    await browser.close();
}
