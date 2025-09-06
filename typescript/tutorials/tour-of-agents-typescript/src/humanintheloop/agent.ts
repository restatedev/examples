import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, tool, wrapLanguageModel, stepCountIs } from "ai";
import {
  InsuranceClaim,
  InsuranceClaimSchema,
  requestHumanReview,
} from "../utils";
import { durableCalls } from "../middleware";

export default restate.service({
  name: "ClaimEvaluationAgent",
  handlers: {
    run: async (ctx: restate.Context, { prompt }: { prompt: string }) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      // <start_here>
      const { text } = await generateText({
        model,
        system:
          "You are an insurance claim evaluation agent. Use these rules: " +
          "* if the amount is more than 1000, ask for human approval, " +
          "* if the amount is less than 1000, decide by yourself",
        prompt,
        tools: {
          humanApproval: tool({
            description: "Ask for human approval for high-value claims.",
            inputSchema: InsuranceClaimSchema,
            execute: async (claim: InsuranceClaim): Promise<boolean> => {
              const approval = ctx.awakeable<boolean>();
              await ctx.run("request-review", () =>
                requestHumanReview(
                  `Please review: ${JSON.stringify(claim)}`,
                  approval.id,
                ),
              );
              return approval.promise;
            },
          }),
        },
        stopWhen: [stepCountIs(5)],
        providerOptions: { openai: { parallelToolCalls: false } },
      });
      // <end_here>
      return text;
    },
  },
});
