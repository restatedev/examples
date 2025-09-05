import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool, wrapLanguageModel } from "ai";
import { z } from "zod";
import { fetchWeather } from "../utils";
import { durableCalls } from "../middleware";

export const weatherAgent = restate.service({
  name: "WeatherAgent",
  handlers: {
    run: async (ctx: restate.Context, { prompt }: { prompt: string }) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o-mini"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      const { text } = await generateText({
        model,
        system: "You are a helpful agent that provides weather updates.",
        prompt,
        tools: {
          getWeather: tool({
            description: "Get the current weather for a given city.",
            inputSchema: z.object({ city: z.string() }),
            execute: async ({ city }) =>
              ctx.run("get weather", () => fetchWeather(city)),
          }),
        },
        stopWhen: [stepCountIs(5)],
        providerOptions: { openai: { parallelToolCalls: false } },
      });

      return text;
    },
  },
});
