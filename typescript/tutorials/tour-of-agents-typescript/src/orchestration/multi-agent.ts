import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool, wrapLanguageModel } from "ai";
import {
  InsuranceClaim,
  InsuranceClaimSchema,
  eligibilityAgent,
  fraudCheckAgent,
} from "../utils";
import { durableCalls } from "../middleware";

export default restate.service({
  name: "ClaimAnalysisOrchestrator",
  handlers: {
    run: async (ctx: restate.Context, claim: InsuranceClaim) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      // <start_here>
      const { text } = await generateText({
        model,
        prompt: `Claim: ${JSON.stringify(claim)}`,
        system:
          "You are a claim decision engine. Analyze the claim  and use your tools to decide whether to approve.",
        tools: {
          analyzeEligibility: tool({
            description: "Analyze eligibility result.",
            inputSchema: InsuranceClaimSchema,
            execute: async (claim: InsuranceClaim) =>
              ctx.serviceClient(eligibilityAgent).run(claim),
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
      // <end_here>

      return text;
    },
  },
});
