import * as restate from "@restatedev/restate-sdk";
import { weatherAgent } from "./getstarted/agent";
import { chatSession } from "./multiturn/agent";
import { manualLoopAgent } from "./manualagentloop/agent";
import { parallelClaimAnalyzer } from "./parallelagents/agent";
import { claimIntakeAgent } from "./humanintheloop/agent";
import { claimApprovalAgent } from "./paralleltools/agent";
import { claimAnalysisOrchestrator } from "./subagents/agent";
import { errorHandlingAgent } from "./errorhandling/agent";

restate
  .endpoint()
  .bind(weatherAgent)
  .bind(claimIntakeAgent)
  .bind(chatSession)
  .bind(claimApprovalAgent)
  .bind(parallelClaimAnalyzer)
  .bind(claimAnalysisOrchestrator)
  .bind(manualLoopAgent)
  .bind(errorHandlingAgent)
  .listen(9080);
