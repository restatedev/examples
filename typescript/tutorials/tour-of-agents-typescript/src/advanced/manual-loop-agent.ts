import * as restate from "@restatedev/restate-sdk";
import { openai } from '@ai-sdk/openai';
import {generateText, ModelMessage, tool, wrapLanguageModel} from 'ai';
import z from 'zod';
import {durableCalls} from "../middleware";
import {fetchWeather} from "../utils";

async function getWeather(ctx: restate.Context, {city}: { city: string }) {
  return ctx.run("get-weather", () => fetchWeather(city));
}

export default restate.service({
  name: "ManualLoopAgent",
  handlers: {
    run: async (ctx: restate.Context, {prompt}: { prompt: string }) => {
      const messages = [{role: 'user', content: prompt} as ModelMessage];

      while (true) {
        const model = wrapLanguageModel({
          model: openai("gpt-4o"),
          middleware: durableCalls(ctx, {maxRetryAttempts: 3}),
        });

        const result = await generateText({
          model,
          messages,
          tools: {
            getWeather: tool({
              name: 'getWeather',
              description: 'Get the current weather in a given location',
              inputSchema: z.object({
                city: z.string(),
              }),
            }),
            // add more tools here, omitting the execute function so you handle it yourself
          },
        });

        messages.push(...result.response.messages);

        if (result.finishReason === 'tool-calls') {
          // Handle all tool call execution here
          for (const toolCall of result.toolCalls) {
            if (toolCall.toolName === 'getWeather') {
              const toolOutput = await getWeather(ctx, toolCall.input as { city: string });
              messages.push({
                role: 'tool',
                content: [
                  {
                    toolName: toolCall.toolName,
                    toolCallId: toolCall.toolCallId,
                    type: 'tool-result',
                    output: {type: 'json', value: toolOutput},
                  },
                ],
              });
            }
            // Handle other tool calls
          }
        } else {
          return result.text;
        }
      }
    }
  }
});