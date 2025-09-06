import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, wrapLanguageModel } from "ai";
import {
  InsuranceClaim,
  eligibilityAgent,
  fraudCheckAgent,
  rateComparisonAgent,
} from "../utils";
import { durableCalls } from "../middleware";

export default restate.service({
  name: "ParallelAgentClaimApproval",
  handlers: {
    run: async (ctx: restate.Context, claim: InsuranceClaim) => {
      const [eligibility, rateComparison, fraudCheck] = await Promise.all([
        ctx.serviceClient(eligibilityAgent).run(claim),
        ctx.serviceClient(rateComparisonAgent).run(claim),
        ctx.serviceClient(fraudCheckAgent).run(claim),
      ]);

      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      const { text } = await generateText({
        model,
        system: "You are a claim decision engine.",
        prompt: `Decide based on: 
        Eligibility: ${eligibility}, Cost: ${rateComparison} Fraud: ${fraudCheck}`,
      });
      return text;
    },
  },
});
