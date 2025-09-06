import * as restate from "@restatedev/restate-sdk";
import weatherAgent from "./durableexecution/agent";
import claimEvaluationAgent from "./humanintheloop/agent";
import claimEvaluationWithTimeoutsAgent from "./humanintheloop/agent-with-timeout";
import chatAgent from "./chat/agent";
import {
  claimEvaluationWithWorkflows,
  humanApprovalWorfklow,
} from "./orchestration/sub-workflow-agent";
import claimOrchestrationAgent from "./orchestration/multi-agent";
import parallelClaimAnalyzer from "./parallelwork/parallel-agents";
import claimApprovalAgent from "./parallelwork/parallel-tools-agent";
import stopOnTerminalErrorAgent from "./errorhandling/stop-on-terminal-tool-agent";
import failOnTerminalErrorAgent from "./errorhandling/fail-on-terminal-tool-agent";
import manualLoopAgent from "./advanced/manual-loop-agent";
import bookingWithRollbackAgent from "./advanced/rollback-agent";
import {
  eligibilityAgent,
  fraudCheckAgent,
  rateComparisonAgent,
} from "./utils";

restate
  .endpoint()
  // Durable execution examples
  .bind(weatherAgent)
  // Human-in-the-loop examples
  .bind(claimEvaluationAgent)
  .bind(claimEvaluationWithTimeoutsAgent)
  // Chat example
  .bind(chatAgent)
  // Orchestration examples
  .bind(claimEvaluationWithWorkflows)
  .bind(humanApprovalWorfklow)
  .bind(claimOrchestrationAgent)
  // Parallel execution examples
  .bind(claimApprovalAgent)
  .bind(parallelClaimAnalyzer)
  // Error handling examples
  .bind(stopOnTerminalErrorAgent)
  .bind(failOnTerminalErrorAgent)
  // Advanced examples
  .bind(bookingWithRollbackAgent)
  .bind(manualLoopAgent)
  // Utils and sub-agents
  .bind(eligibilityAgent)
  .bind(fraudCheckAgent)
  .bind(rateComparisonAgent)
  .listen(9080);
