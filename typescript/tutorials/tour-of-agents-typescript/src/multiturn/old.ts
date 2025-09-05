import * as restate from "@restatedev/restate-sdk";

import { openai } from "@ai-sdk/openai";
import { ModelMessage, wrapLanguageModel, generateObject } from "ai";
import { z } from "zod";
import { durableCalls, superJson } from "../middleware";
import { submitClaim, InsuranceClaimSchema } from "../utils";
import { ObjectContext } from "@restatedev/restate-sdk";

const ClaimResponseSchema = z.object({
  claimData: InsuranceClaimSchema,
  responseText: z
    .string()
    .describe(
      "Response to the user - either asking for missing information or confirming submission",
    ),
  shouldSubmit: z
    .boolean()
    .describe(
      "Whether all required information is available to submit the claim",
    ),
});

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default restate.object({
  name: "ClaimIntakeAgent",
  handlers: {
    message: async (ctx: ObjectContext, req: { prompt: string }) => {
      // Retrieve message history from state
      const messages = (await ctx.get<Message[]>("messages")) ?? [];
      messages.push({ role: "user", content: req.prompt });

      // Call the LLM to extract/confirm claim data
      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      const result = (
        await generateObject({
          model,
          system: `You are an insurance claim processing agent. 
        Extract all available information and structure it into the insurance claim format.
        If any required information is missing, set shouldSubmit to false and provide a friendly message asking for the missing information.
        If all required information is available, set shouldSubmit to true and provide a confirmation message.`,
          messages,
          schema: ClaimResponseSchema,
        })
      ).object;

      messages.push({
        role: "assistant",
        content: JSON.stringify(result),
      });
      ctx.set("messages", messages);

      if (result.shouldSubmit) {
        await ctx.run("submit", async () => submitClaim(result.claimData));
      }

      return result.responseText;
    },
    getMessages: restate.handlers.object.shared(
      async (ctx: restate.ObjectSharedContext) => {
        return (await ctx.get<ModelMessage[]>("messages", superJson)) ?? [];
      },
    ),
  },
});
