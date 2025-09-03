import * as restate from "@restatedev/restate-sdk";
import { openai } from "@ai-sdk/openai";
import { generateText, tool, wrapLanguageModel, Output } from "ai";
import {
  addClaimToLegacySystem,
  emailCustomer,
  InsuranceClaim,
  InsuranceClaimSchema,
} from "../utils";
import { durableCalls } from "../middleware";

async function runInsuranceClaimAgent(ctx: restate.Context, prompt: string) {
  const claimId = ctx.rand.uuidv4();

  const model = wrapLanguageModel({
    model: openai("gpt-4o-mini"),
    middleware: durableCalls(ctx),
  });

  const response = await generateText({
    model,
    prompt: `Extract claim data: ${prompt} and fill in missing fields by asking the customer.`,
    tools: {
      askMoreInfo: tool({
        description:
          "If the claim data is incomplete, ask the customer for additional information.",
        inputSchema: InsuranceClaimSchema,
        execute: async (claim: InsuranceClaim) => {
          const responsePromise = ctx.awakeable<string>();
          await ctx.run("email", () =>
            emailCustomer(
              "Please provide the missing data: " + JSON.stringify(claim),
              responsePromise.id,
            ),
          );
          return `Additional information: ${await responsePromise.promise}`;
        },
      }),
    },
    experimental_output: Output.object({ schema: InsuranceClaimSchema }),
  });
  const claim = response.experimental_output;

  await ctx.run("create", () => addClaimToLegacySystem(claimId, claim));
  return `Claim ${claimId} for ${claim.amount} due to ${claim.reason} has been processed.`;
}

const insuranceClaimAgent = restate.service({
  name: "InsuranceClaimAgent",
  handlers: {
    run: runInsuranceClaimAgent,
  },
});

restate.endpoint().bind(insuranceClaimAgent).listen(9080);
