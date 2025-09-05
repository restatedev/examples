import * as restate from "@restatedev/restate-sdk";

import { openai } from "@ai-sdk/openai";
import {
  ModelMessage,
  generateText,
  wrapLanguageModel,
  Output,
  tool,
} from "ai";
import { durableCalls, superJson } from "../middleware";
import { emailCustomer, InsuranceClaim, InsuranceClaimSchema } from "../utils";

interface ChatState {
  messages: ModelMessage[];
}

export const chatSession = restate.object({
  name: "Chat",
  handlers: {
    message: async (
      ctx: restate.ObjectContext<ChatState>,
      { prompt }: { prompt: string },
    ) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o-mini"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      const response = await generateText({
        model,
        system: `Extract claim data and fill in missing fields by asking the customer.`,
        prompt,
        tools: {
          askMoreInfo: tool({
            description:
              "If the claim data is incomplete, ask the customer for additional information.",
            inputSchema: InsuranceClaimSchema,
            execute: async (claim: InsuranceClaim) => {
              const responsePromise = ctx.awakeable<string>();
              await ctx.run("email", () =>
                emailCustomer(
                  "Please provide the missing data: " + JSON.stringify(claim),
                  responsePromise.id,
                ),
              );
              return `Additional information: ${await responsePromise.promise}`;
            },
          }),
        },
        experimental_output: Output.object({ schema: InsuranceClaimSchema }),
        providerOptions: { openai: { parallelToolCalls: false } },
      });

      const messages = (await ctx.get("messages", superJson)) ?? [];

      messages.push({ role: "user", content: prompt } as ModelMessage);

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
