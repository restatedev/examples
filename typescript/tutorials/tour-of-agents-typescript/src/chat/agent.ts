import * as restate from "@restatedev/restate-sdk";
import { durableCalls, superJson } from "../middleware";

import { openai } from "@ai-sdk/openai";
import { generateText, ModelMessage, wrapLanguageModel } from "ai";
import { handlers } from "@restatedev/restate-sdk";
import shared = handlers.object.shared;

export default restate.object({
  name: "Chat",
  handlers: {
    message: async (ctx: restate.ObjectContext, req: { message: string }) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      const messages =
        (await ctx.get<ModelMessage[]>("messages", superJson)) ?? [];
      messages.push({ role: "user", content: req.message });

      const res = await generateText({
        model,
        system: "You are a helpful assistant.",
        messages,
      });

      ctx.set("messages", [...messages, ...res.response.messages], superJson);
      return { answer: res.text };
    },
    getHistory: shared(async (ctx: restate.ObjectSharedContext) =>
      ctx.get<ModelMessage[]>("messages", superJson),
    ),
  },
});
