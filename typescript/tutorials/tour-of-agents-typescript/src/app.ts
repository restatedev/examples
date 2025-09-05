import * as restate from "@restatedev/restate-sdk";
import weatherAgent from "./getstarted/agent";
import chatAgent from "./multiturn/agent";
import manualLoopAgent from "./manualagentloop/agent";
import parallelClaimAnalyzer from "./parallelagents/agent";
import claimEvaluationAgent from "./humanintheloop/agent";
import claimApprovalAgent from "./paralleltools/agent";
import claimAnalysisOrchestrator from "./subagents/agent";
import errorHandlingAgent from "./errorhandling/agent";
import claimEvaluationWithTimeoutsAgent from "./humanintheloop/agent-with-timeout";

restate
  .endpoint()
  .bind(weatherAgent)
  .bind(chatAgent)
  .bind(claimApprovalAgent)
  .bind(claimEvaluationAgent)
  .bind(claimEvaluationWithTimeoutsAgent)
  .bind(parallelClaimAnalyzer)
  .bind(claimAnalysisOrchestrator)
  .bind(manualLoopAgent)
  .bind(errorHandlingAgent)
  .listen(9080);
