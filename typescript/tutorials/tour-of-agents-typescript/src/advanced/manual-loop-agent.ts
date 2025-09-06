import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, ModelMessage, tool, wrapLanguageModel } from "ai";
import { z } from "zod";
import { fetchWeather } from "../utils";
import { durableCalls, superJson } from "../middleware";

const WeatherRequestSchema = z.object({
  city: z.string(),
});

export type WeatherRequest = z.infer<typeof WeatherRequestSchema>;

async function getWeather(ctx: restate.ObjectContext, req: WeatherRequest) {
  return ctx.run("get weather", () => fetchWeather(req.city));
}

const tools: Record<
  string,
  (ctx: restate.ObjectContext, req: any) => Promise<any>
> = {
  getWeather: getWeather,
};

export default restate.object({
  name: "ManualLoopAgent",
  handlers: {
    run: async (ctx: restate.ObjectContext, { prompt }: { prompt: string }) => {
      const messages =
        (await ctx.get<ModelMessage[]>("messages", superJson)) ?? [];

      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      while (true) {
        const result = await generateText({
          model,
          system: "You are a helpful agent that provides weather updates.",
          prompt,
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
        ctx.set("messages", messages, superJson);

        if (result.finishReason === "tool-calls") {
          const toolCalls = result.toolCalls;

          // Handle all tool call execution in parallel
          const toolResults = await Promise.all(
            toolCalls.map(async (toolCall) => ({
              toolCall,
              result: await tools[toolCall.toolName](ctx, toolCall.input),
            })),
          );

          for (const { toolCall, result } of toolResults) {
            messages.push({
              role: "tool",
              content: [
                {
                  toolName: toolCall.toolName,
                  toolCallId: toolCall.toolCallId,
                  type: "tool-result",
                  output: { type: "json", value: result },
                },
              ],
            });
          }
          ctx.set("messages", messages, superJson);
        } else {
          break;
        }
      }

      return messages;
    },
  },
});
