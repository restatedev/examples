import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool, wrapLanguageModel } from "ai";
import {
  emailCustomer,
  InsuranceClaim,
  InsuranceClaimSchema,
  eligibilityAgent,
  fraudCheckAgent,
  rateComparisonAgent,
} from "../utils";
import { durableCalls } from "../middleware";

export default restate.service({
  name: "ClaimAnalysisOrchestrator",
  handlers: {
    run: async (ctx: restate.Context, claim: InsuranceClaim) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o-mini"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      const decision = await generateText({
        model,
        prompt: `Analyze the claim ${claim} and use your tools to decide whether to approve.`,
        system: "You are a claim decision engine.",
        tools: {
          analyzeEligibility: tool({
            description: "Analyze eligibility result.",
            inputSchema: InsuranceClaimSchema,
            execute: async (claim: InsuranceClaim) =>
              ctx.serviceClient(eligibilityAgent).run(claim),
          }),
          analyzeCost: tool({
            description: "Compare cost to standard rates.",
            inputSchema: InsuranceClaimSchema,
            execute: async (claim: InsuranceClaim) =>
              ctx.serviceClient(rateComparisonAgent).run(claim),
          }),
          analyzeFraud: tool({
            description: "Analyze probability of fraud.",
            inputSchema: InsuranceClaimSchema,
            execute: async (claim: InsuranceClaim) =>
              ctx.serviceClient(fraudCheckAgent).run(claim),
          }),
        },
        stopWhen: [stepCountIs(10)],
        providerOptions: { openai: { parallelToolCalls: false } },
      });

      await ctx.run("notify", () => emailCustomer(decision.text));

      return decision.text;
    },
  },
});
