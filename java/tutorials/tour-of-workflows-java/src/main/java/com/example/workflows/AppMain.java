package com.example.workflows;

import com.example.workflows.workflows.*;
import com.example.workflows.utils.EmailService;
import com.example.workflows.utils.UserService;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

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
            .bind(new EmailService())
            .bind(new UserService()));
  }
}
