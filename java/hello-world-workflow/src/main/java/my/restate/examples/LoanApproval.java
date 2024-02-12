/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */
package my.restate.examples;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.annotation.ServiceType;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.sdk.workflow.DurablePromiseKey;
import dev.restate.sdk.workflow.WorkflowContext;
import dev.restate.sdk.workflow.WorkflowSharedContext;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.math.BigDecimal;

@Service(ServiceType.WORKFLOW)
public class LoanApproval {

    // --- Data types used by the LoanApproval

    private static final Logger LOG = LogManager.getLogger(LoanApproval.class);

    public static final StateKey<Status> STATUS =
            StateKey.of("status", JacksonSerdes.of(Status.class));
    private static final DurablePromiseKey<Boolean> HUMAN_APPROVAL =
            DurablePromiseKey.of("humanApproval", CoreSerdes.JSON_BOOLEAN);

    // --- The main workflow method

    @Workflow
    public void run(WorkflowContext ctx, LoanApprovalRequest loanApprovalRequest) {
        // 1. Set status
        ctx.set(STATUS, Status.SUBMITTED);

        LOG.info("Loan request submitted");

        // 2. Ask human approval
        ctx.sideEffect(() -> askHumanApproval(ctx.workflowKey(), loanApprovalRequest));
        ctx.set(STATUS, Status.WAITING_HUMAN_APPROVAL);

        // 3. Wait human approval
        boolean approved = ctx.durablePromise(HUMAN_APPROVAL).awaitable().await();
        if (!approved) {
            LOG.info("Not approved");
            ctx.set(STATUS, Status.NOT_APPROVED);
            return;
        }
        LOG.info("Approved");
        ctx.set(STATUS, Status.APPROVED);
    }

    // --- Methods to approve/reject loan

    @Shared
    public void approveLoan(WorkflowSharedContext ctx) {
        ctx.durablePromiseHandle(HUMAN_APPROVAL).resolve(true);
    }

    @Shared
    public void rejectLoan(WorkflowSharedContext ctx) {
        ctx.durablePromiseHandle(HUMAN_APPROVAL).resolve(false);
    }

    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
                // Register the LoanApproval workflow
                .with(new LoanApproval())
                .buildAndListen();

        // Look at the test example for an example to invoke the workflow!
    }

    // -- Data types and mocks

    // Usually you define a status for your workflow
    // This can be accessed directly from the external client
    public enum Status {
        SUBMITTED,
        WAITING_HUMAN_APPROVAL,
        APPROVED,
        NOT_APPROVED
    }

    // Input/output object are serialized/deserialized using Jackson
    public static class LoanApprovalRequest {

        private final String customerName;
        private final BigDecimal amount;

        @JsonCreator
        public LoanApprovalRequest(
                @JsonProperty("customerName") String customerName,
                @JsonProperty("amount") BigDecimal amount) {
            this.customerName = customerName;
            this.amount = amount;
        }

        public String getCustomerName() {
            return customerName;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        @Override
        public String toString() {
            return "LoanApprovalRequest{" +
                    "customerName='" + customerName + '\'' +
                    ", amount=" + amount +
                    '}';
        }
    }

    private static void askHumanApproval(String loanId, LoanApprovalRequest loanApprovalRequest) throws InterruptedException {
        LOG.info("Sending human approval request {}: {}", loanId, loanApprovalRequest);
        Thread.sleep(1000);
    }
}
