import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import {
  generateText,
  ModelMessage,
  tool,
  wrapLanguageModel,
} from "ai";
import { z } from "zod";
import { fetchWeather } from "../utils";
import { durableCalls } from "../middleware";

const WeatherRequestSchema = z.object({
  city: z.string(),
});

export type WeatherRequest = z.infer<typeof WeatherRequestSchema>;

async function getWeather(ctx: restate.Context, req: WeatherRequest) {
  return ctx.run("get weather", () => fetchWeather(req.city));
}

const runWeatherAgent = async (ctx: restate.Context, prompt: string) => {
  const messages: ModelMessage[] = [];

  const model = wrapLanguageModel({
    model: openai("gpt-4o-mini"),
    middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
  });

  while (true) {
    const result = await generateText({
      model,
      messages: [{ role: "user", content: prompt }],
      tools: {
        getWeather: tool({
          description: "Get the current weather in a given location",
          inputSchema: WeatherRequestSchema,
        }),
        // add more tools here, omitting the execute function so you handle it yourself
      },
    });

    // Add LLM generated messages to the message history
    messages.push(...result.response.messages);

    if (result.finishReason === "tool-calls") {
      const toolCalls = result.toolCalls;

      // Handle all tool call execution here
      for (const toolCall of toolCalls) {
        if (toolCall.toolName === "getWeather") {
          const toolOutput = await getWeather(
            ctx,
            toolCall.input as WeatherRequest,
          );
          messages.push({
            role: "tool",
            content: [
              {
                toolName: toolCall.toolName,
                toolCallId: toolCall.toolCallId,
                type: "tool-result",
                output: { type: "json", value: toolOutput },
              },
            ],
          });
        }
        // Handle other tool calls
      }
    } else {
      break;
    }
  }

  return messages;
};

const weatherAgent = restate.service({
  name: "WeatherAgent",
  handlers: {
    run: runWeatherAgent,
  },
});

restate.endpoint().bind(weatherAgent).listen(9080);
