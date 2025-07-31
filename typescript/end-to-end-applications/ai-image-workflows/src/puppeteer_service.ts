import * as puppeteer from "puppeteer";
import * as restate from "@restatedev/restate-sdk";
import { WorkflowStep } from "./types/types";

type PuppeteerParams = { url: string; viewport?: { width?: number; height?: number } };

export const puppeteerService = restate.service({
  name: "puppeteer-service",
  handlers: {
    run: async (ctx: restate.Context, wf: WorkflowStep) => {
      console.info(`Taking screenshot of website with parameters: ${wf}`);
      const puppeteerParams = wf.parameters as PuppeteerParams;

      await ctx.run(async () => takeWebsiteScreenshot(wf.imgOutputPath!, puppeteerParams));

      return {
        msg: `[Took screenshot of website with url: ${puppeteerParams.url}]`,
      };
    },
  },
});

async function takeWebsiteScreenshot(
  imgOutputPath: `${string}.${puppeteer.ImageFormat}`,
  params: PuppeteerParams,
) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({
    width: params.viewport?.width ?? 1388,
    height: params.viewport?.height ?? 800,
  });
  await page.goto(params.url);
  await page.screenshot({
    path: imgOutputPath,
  });
  await browser.close();
}
