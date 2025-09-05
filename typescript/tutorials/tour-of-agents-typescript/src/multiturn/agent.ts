import * as restate from "@restatedev/restate-sdk";

import { openai } from "@ai-sdk/openai";
import { ModelMessage, generateText, wrapLanguageModel } from "ai";
import { durableCalls, superJson } from "../middleware";

interface ChatState {
  messages: ModelMessage[];
}

export const chatSession = restate.object({
  name: "Chat",
  handlers: {
    message: async (ctx: restate.ObjectContext<ChatState>, message: string) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      const messages = (await ctx.get("messages", superJson)) ?? [];

      messages.push({ role: "user", content: message } as ModelMessage);

      const res = await generateText({
        model,
        system: "You are a helpful assistant.",
        maxRetries: 0,
        messages,
      });

      ctx.set("messages", [...messages, ...res.response.messages], superJson);
      return res.text;
    },
    getMessages: restate.handlers.object.shared(
      async (ctx: restate.ObjectSharedContext<ChatState>) => {
        return (await ctx.get("messages", superJson)) ?? [];
      },
    ),
  },
});
