import * as restate from "@restatedev/restate-sdk";
import weatherAgent from "./durableexecution/agent";
import humanClaimApprovalAgent from "./humanintheloop/agent";
import humanClaimApprovalWithTimeoutsAgent from "./humanintheloop/agent-with-timeout";
import chatAgent from "./chat/agent";
import {
  subWorkflowClaimApprovalAgent,
  humanApprovalWorfklow,
} from "./orchestration/sub-workflow-agent";
import multiAgentClaimApproval from "./orchestration/multi-agent";
import parallelAgentClaimApproval from "./parallelwork/parallel-agents";
import parallelToolClaimAgent from "./parallelwork/parallel-tools-agent";
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
  .bind(humanClaimApprovalAgent)
  .bind(humanClaimApprovalWithTimeoutsAgent)
  // Chat example
  .bind(chatAgent)
  // Orchestration examples
  .bind(subWorkflowClaimApprovalAgent)
  .bind(humanApprovalWorfklow)
  .bind(multiAgentClaimApproval)
  // Parallel execution examples
  .bind(parallelToolClaimAgent)
  .bind(parallelAgentClaimApproval)
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
