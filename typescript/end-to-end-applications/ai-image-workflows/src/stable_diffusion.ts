import * as restate from "@restatedev/restate-sdk";
import { WorkflowStep } from "./types/types";
import axios from "axios";
import Jimp from "jimp";

type StableDiffusionParams = { prompt: string; steps?: number };

export const stableDiffusion = restate.service({
  name: "stable-diffusion",
  handlers: {
    generate: async (ctx: restate.Context, wf: WorkflowStep) => {
      const stableDiffusionParams = wf.parameters as StableDiffusionParams;

      ctx.console.info(`Generating image: ${stableDiffusionParams}`);
      await callStableDiffusion(ctx, wf.imgOutputPath!, stableDiffusionParams);

      return {
        msg: `[Generated stable diffusion image: ${stableDiffusionParams}]`,
      };
    },
    transform: async (ctx: restate.Context, wf: WorkflowStep) => {
      const { prompt } = wf.parameters as { prompt: string };
      const image = await Jimp.read(wf.imgInputPath!);
      const base64EncodedImg = (await image.getBufferAsync(Jimp.MIME_PNG)).toString("base64");
      const stableDiffusionParams = {
        ...{ prompt },
        init_images: [base64EncodedImg],
      };

      ctx.console.info(`Transforming image with prompt: ${prompt}`);
      await callStableDiffusion(ctx, wf.imgOutputPath!, stableDiffusionParams);

      return {
        msg: `[Transformed image with stable diffusion prompt: ${prompt}]`,
      };
    },
  },
});

restate.serve({
  services: [stableDiffusion],
  port: 9081,
});

async function callStableDiffusion(
  ctx: restate.Context,
  imgOutputPath: string,
  params: StableDiffusionParams,
) {
  const awakeable = ctx.awakeable<string>();

  await ctx.run(async () => {
    // invoke the stable diffusion service with our awakeable as callback
    await axios.post("http://localhost:5050/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ params: params, callback: awakeable.id }),
    });
  });

  // wait for the callback from the stable diffusion service containing the generated image
  const generatedImg = await awakeable.promise;

  const decodedImage = Buffer.from(generatedImg, "base64");
  const jimpImage = await Jimp.read(decodedImage);
  await ctx.run(() => {
    jimpImage.writeAsync(imgOutputPath);
  });
}
