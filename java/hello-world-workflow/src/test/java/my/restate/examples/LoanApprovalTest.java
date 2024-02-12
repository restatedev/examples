package my.restate.examples;

import dev.restate.sdk.testing.RestateGrpcChannel;
import dev.restate.sdk.testing.RestateRunner;
import dev.restate.sdk.testing.RestateRunnerBuilder;
import dev.restate.sdk.workflow.generated.WorkflowExecutionState;
import io.grpc.ManagedChannel;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LoanApprovalTest {

  // Runner runs Restate using testcontainers and registers services
  @RegisterExtension
  private static final RestateRunner restateRunner = RestateRunnerBuilder.create()
          .withRestateContainerImage("ghcr.io/restatedev/restate:main")
          // Service to test
          .with(new LoanApproval())
          .buildRunner();

  @Test
  void testGreet(
          // Channel to send requests to Restate services
          @RestateGrpcChannel ManagedChannel channel) throws InterruptedException {

    // This client is generated directly from the annotation
    LoanApprovalExternalClient client = new LoanApprovalExternalClient(channel, "my-loan");

    // Submit the workflow
    WorkflowExecutionState state =
            client.submit(
                    new LoanApproval.LoanApprovalRequest(
                            "Francesco", new BigDecimal("1000000000")));

    // Starting the workflow first time returns started, the subsequent times returns the workflow state
    assertEquals(state, WorkflowExecutionState.STARTED);

    // You can inspect the status while the workflow is running
    System.out.println("Current status: " + client.getState(LoanApproval.STATUS));

    // Now let's approve the loan invoking the method approveLoan()
    client.approveLoan();

    // Check the workflow is completed by invoking client#isCompleted()
    while (!client.isCompleted()) {
      Thread.sleep(1_000);
    }

    // We can inspect the status at the end as well
    assertEquals(LoanApproval.Status.APPROVED, client.getState(LoanApproval.STATUS).get());
  }
}
