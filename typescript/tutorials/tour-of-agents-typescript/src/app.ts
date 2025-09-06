import * as restate from "@restatedev/restate-sdk";
import stopOnTerminalErrorAgent from "./errorhandling/stop-on-terminal-tool";
import failOnTerminalErrorAgent from "./errorhandling/fail-on-terminal-tool";
import weatherAgent from "./getstarted/agent";
import claimEvaluationAgent from "./humanintheloop/agent";
import claimEvaluationWithTimeoutsAgent from "./humanintheloop/agent-with-timeout";
import manualLoopAgent from "./advanced/manual-agent-loop";
import bookingRollbackAgent from "./advanced/rollback-agent";
import claimOrchestrationAgent from "./multiagent/agent";
import chatAgent from "./chat/agent";
import parallelClaimAnalyzer from "./parallelwork/parallel-agents";
import claimApprovalAgent from "./parallelwork/parallel-tools-agent";
import {
  claimEvaluationWithWorkflows,
  humanApprovalWorfklow,
} from "./subworkflows/agent";
import {
  eligibilityAgent,
  fraudCheckAgent,
  rateComparisonAgent,
} from "./utils";

restate
  .endpoint()
  .bind(weatherAgent)
  .bind(chatAgent)
  .bind(claimApprovalAgent)
  .bind(claimEvaluationAgent)
  .bind(claimEvaluationWithTimeoutsAgent)
  .bind(claimOrchestrationAgent)
  .bind(parallelClaimAnalyzer)
  .bind(claimEvaluationWithWorkflows)
  .bind(humanApprovalWorfklow)
  .bind(manualLoopAgent)
  .bind(stopOnTerminalErrorAgent)
  .bind(failOnTerminalErrorAgent)
  .bind(bookingRollbackAgent)
  .bind(eligibilityAgent)
  .bind(fraudCheckAgent)
  .bind(rateComparisonAgent)
  .listen(9080);
