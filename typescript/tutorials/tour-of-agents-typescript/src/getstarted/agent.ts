import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool, wrapLanguageModel } from "ai";
import { z } from "zod";
import { fetchWeather } from "../utils";
import { durableCalls } from "../middleware";

const runWeatherAgent = async (ctx: restate.Context, prompt: string) => {
  const model = wrapLanguageModel({
    model: openai("gpt-4o-mini"),
    middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
  });

  const { text } = await generateText({
    model,
    tools: {
      getWeather: tool({
        description: "Get the current weather for a given city.",
        inputSchema: z.object({ city: z.string() }),
        execute: async ({ city }) => {
          return await ctx.run("get weather", () => fetchWeather(city));
        },
      }),
    },
    stopWhen: [stepCountIs(5)],
    system: "You are a helpful agent that provides weather updates.",
    messages: [{ role: "user", content: prompt }],
  });

  return text;
};

export const weatherAgent = restate.service({
  name: "WeatherAgent",
  handlers: {
    run: runWeatherAgent,
  },
});
