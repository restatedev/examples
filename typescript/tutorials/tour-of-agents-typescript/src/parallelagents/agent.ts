import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, wrapLanguageModel } from "ai";
import {
  emailCustomer,
  InsuranceClaim,
  eligibilityAgent,
  fraudCheckAgent,
  rateComparisonAgent,
} from "../utils";
import { durableCalls } from "../middleware";

export default restate.service({
  name: "ParallelClaimAnalyzer",
  handlers: {
    run: async (ctx: restate.Context, claim: InsuranceClaim) => {
      const [eligibility, rateComparison, fraudCheck] = await Promise.all([
        ctx.serviceClient(eligibilityAgent).run(claim),
        ctx.serviceClient(rateComparisonAgent).run(claim),
        ctx.serviceClient(fraudCheckAgent).run(claim),
      ]);

      const model = wrapLanguageModel({
        model: openai("gpt-4o-mini"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      const decision = await generateText({
        model,
        system: "You are a claim decision engine.",
        prompt: `Make final claim decision based on: 
                    Eligibility: ${eligibility}
                    Cost: ${rateComparison} 
                    Fraud: ${fraudCheck}`,
      });

      await ctx.run("notify", () => emailCustomer(decision.text));

      return decision.text;
    },
  },
});
