import * as restate from "@restatedev/restate-sdk";
import { RestatePromise } from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, tool, wrapLanguageModel, Output, stepCountIs } from "ai";
import {
  compareToStandardRates,
  checkEligibility,
  checkFraud,
  InsuranceClaim,
  InsuranceClaimSchema,
} from "../utils";
import { durableCalls } from "../middleware";

export default restate.service({
  name: "ParallelToolClaimAgent",
  handlers: {
    run: async (ctx: restate.Context, claim: InsuranceClaim) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      // <start_here>
      const { text } = await generateText({
        model,
        prompt: `Analyze the claim ${JSON.stringify(claim)}. 
        Use your tools to calculate key metrics and decide whether to approve.`,
        tools: {
          calculateMetrics: tool({
            description: "Calculate claim metrics.",
            inputSchema: InsuranceClaimSchema,
            execute: async (claim: InsuranceClaim) => {
              return RestatePromise.all([
                ctx.run("eligibility", () => checkEligibility(claim)),
                ctx.run("cost", () => compareToStandardRates(claim)),
                ctx.run("fraud", () => checkFraud(claim)),
              ]);
            },
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
