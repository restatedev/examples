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

export const errorHandlingAgent = restate.service({
  name: "ErrorHandlingAgent",
  handlers: {
    run: async (ctx: restate.Context, prompt: string) => {
      // <start_max_attempts_example>
      const model = wrapLanguageModel({
        model: openai("gpt-4o-mini"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });
      // <end_max_attempts_example>

      // OPTION 1: let the LLM decide what to do with the terminal error - use it as new input
      // <start_option1>
      const response1 = await generateText({
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
        providerOptions: { openai: { parallelToolCalls: false } },
      });
      // <end_option1>

      // OPTION 2: rethrow terminal tool errors as exceptions to fail the workflow
      // <start_option2>
      const response2 = await generateText({
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

      // OPTION 3: stop the agent when a terminal tool error occurs and handle it manually
      // <start_option3>
      const { steps, text } = await generateText({
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
        stopWhen: [stepCountIs(5), hasTerminalToolError],
        system: "You are a helpful agent that provides weather updates.",
        messages: [{ role: "user", content: prompt }],
      });

      const terminalSteps = getTerminalToolSteps(steps);
      if (terminalSteps.length > 0) {
        // Do something with the terminal tool error steps
      }
      // <end_option3>

      return text;
    },
  },
});
