import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, wrapLanguageModel } from "ai";
import {
  emailCustomer,
  InsuranceClaim,
  runEligibilityAgent,
  runFraudAgent,
  runRateComparisonAgent,
} from "../utils";
import { durableCalls } from "../middleware";

export const claimAnalyzerAgent = restate.service({
  name: "medical-claim-analyzer",
  handlers: {
    run: async (ctx: restate.Context, claim: InsuranceClaim) => {
      const [eligibility, rateComparison, fraudCheck] = await Promise.all([
        ctx.serviceClient(eligibilityAgent).run(claim),
        ctx.serviceClient(rateComparisonAgent).run(claim),
        ctx.serviceClient(fraudCheckAgent).run(claim),
      ]);

      const model = wrapLanguageModel({
        model: openai("gpt-4o-mini"),
        middleware: durableCalls(ctx),
      });

      const decision = await generateText({
        model,
        prompt: `Make final claim decision based on: 
                    Eligibility: ${eligibility}
                    Cost: ${rateComparison} 
                    Fraud: ${fraudCheck}`,
        system: "You are a claim decision engine.",
      });

      await ctx.run("notify", () => emailCustomer(decision.text));

      return decision.text;
    },
  },
});

// Sub-agents

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
