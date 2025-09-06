import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool, wrapLanguageModel } from "ai";
import { z } from "zod";
import { fetchWeather } from "../utils";
import {
  durableCalls,
  getTerminalToolSteps,
  hasTerminalToolError,
  rethrowTerminalToolError,
} from "../middleware";

export default restate.service({
  name: "FailOnTerminalErrorAgent",
  handlers: {
    run: async (ctx: restate.Context, prompt: string) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      // OPTION 2: rethrow terminal tool errors as exceptions to fail the workflow
      // <start_option2>
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
        onStepFinish: rethrowTerminalToolError,
        system: "You are a helpful agent that provides weather updates.",
        messages: [{ role: "user", content: prompt }],
      });
      // <end_option2>

      return text;
    },
  },
});
