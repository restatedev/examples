import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, tool, wrapLanguageModel } from "ai";
import {
  emailCustomer,
  InsuranceClaim,
  InsuranceClaimSchema,
  runEligibilityAgent,
  runFraudAgent,
  runRateComparisonAgent,
} from "../utils";
import { durableCalls } from "../middleware";

export const claimAnalyzerAgent = restate.service({
  name: "medical-claim-analyzer",
  handlers: {
    run: async (ctx: restate.Context, claim: InsuranceClaim) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o-mini"),
        middleware: durableCalls(ctx),
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
      });

      await ctx.run("notify", () => emailCustomer(decision.text));

      return decision.text;
    },
  },
});

const eligibilityAgent = restate.service({
  name: "EligibilityAgent",
  handlers: {
    run: runEligibilityAgent,
  },
});

const rateComparisonAgent = restate.service({
  name: "RateComparisonAgent",
  handlers: {
    run: runRateComparisonAgent,
  },
});

const fraudCheckAgent = restate.service({
  name: "FraudCheckAgent",
  handlers: {
    run: runFraudAgent,
  },
});
