import * as restate from "@restatedev/restate-sdk";
import { RestatePromise } from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, tool, wrapLanguageModel, Output } from "ai";
import {
  compareToStandardRates,
  doEligibilityCheck,
  doFraudCheck,
  InsuranceClaim,
  InsuranceClaimSchema,
} from "../utils";
import { durableCalls } from "../middleware";

export const claimApprovalAgent = restate.service({
  name: "ClaimApprovalAgent",
  handlers: {
    run: async (ctx: restate.Context, claim: InsuranceClaim) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o-mini"),
        middleware: durableCalls(ctx),
      });

      const response = await generateText({
        model,
        prompt: `Analyze the claim ${JSON.stringify(claim)}. 
        Decide whether to auto-approve or flag for human review.`,
        tools: {
          calculateMetrics: tool({
            description: "Calculate claim metrics.",
            inputSchema: InsuranceClaimSchema,
            execute: async (claim: InsuranceClaim) => {
              // Start analyses in parallel
              const eligibilityCheck = ctx.run("eligibility check", () =>
                doEligibilityCheck(claim),
              );
              const costReasonablenessScore = ctx.run(
                "cost reasonableness",
                () => compareToStandardRates(claim),
              );
              const fraudProbability = ctx.run("fraud check", () =>
                doFraudCheck(claim),
              );

              // Wait for all analyses to complete
              return await RestatePromise.allSettled([
                eligibilityCheck,
                costReasonablenessScore,
                fraudProbability,
              ]);
            },
          }),
        },
      });
      return response.text;
    },
  },
});
