package my.example;

import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import my.example.utils.UserService;
import my.example.workflows.*;

public class AppMain {

  public static void main(String[] args) {
    RestateHttpServer.listen(
        Endpoint
            // Workflows
            .bind(new SignupWorkflow())
            .bind(new SignupWithActivitiesWorkflow())
            .bind(new SignupWithEventsWorkflow())
            .bind(new SignupWithQueriesWorkflow())
            .bind(new SignupWithRetriesWorkflow())
            .bind(new SignupWithSagasWorkflow())
            .bind(new SignupWithSignalsWorkflow())
            .bind(new SignupWithTimersWorkflow())
            // Utils
            .bind(new UserService()));
  }
}
