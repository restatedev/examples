package my.example;

import dev.restate.client.Client;
import my.example.types.User;
import my.example.workflows.SignupWorkflowClient;

public class WorkflowSubmitter {

  public static void main(String[] args) throws Exception {
    User user = new User("John Doe", "john@mail.com");
    // <start_submit>
    Client restateClient = Client.connect("http://localhost:8080");

    boolean result =
        SignupWorkflowClient.fromClient(restateClient, "user-123").submit(user).attach().response();
    // <end_submit>

    System.out.println("Workflow result: " + result);
  }
}
