// package com.example.workflows;
//
// import dev.restate.sdk.client.Client;
// import com.example.workflows.utils.Utils.*;
//
// public class Client {
//
//    public static void main(String[] args) throws Exception {
//        dev.restate.sdk.client.Client restateClient =
//            dev.restate.sdk.client.Client.connect("http://localhost:8080");
//
//        System.out.println("=== Testing Basic Signup Workflow ===");
//        User user1 = new User("John Doe", "john@mail.com");
//        WorkflowResult result1 = GetStartedWorkflowClient
//            .fromClient(restateClient, "user-123")
//            .run(user1)
//            .await();
//        System.out.println("Result: " + result1.success);
//
//        System.out.println("\n=== Testing Signup with Activities ===");
//        User user2 = new User("Jane Smith", "jane@mail.com");
//        WorkflowResult result2 = ActivitiesWorkflowClient
//            .fromClient(restateClient, "user-124")
//            .run(user2)
//            .await();
//        System.out.println("Result: " + result2.success);
//
//        System.out.println("\n=== Testing Signup with Queries ===");
//        User user3 = new User("Bob Wilson", "bob@mail.com");
//        // Submit workflow asynchronously
//        QueriesWorkflowClient
//            .fromClient(restateClient, "user-125")
//            .submit(user3);
//
//        Thread.sleep(1000); // Give workflow time to start
//
//        // Query status
//        StatusResponse status = QueriesWorkflowClient
//            .fromClient(restateClient, "user-125")
//            .getStatus()
//            .await();
//        System.out.println("Status: " + status.status);
//
//        System.out.println("\n=== Testing Signup with Events ===");
//        User user4 = new User("Alice Johnson", "alice@mail.com");
//        EventsWorkflowClient
//            .fromClient(restateClient, "user-126")
//            .submit(user4);
//
//        System.out.println("\n=== Testing Signup with Signals ===");
//        User user5 = new User("Charlie Brown", "charlie@mail.com");
//        SignalsWorkflowClient
//            .fromClient(restateClient, "user-127")
//            .submit(user5);
//        // To complete this, you would need to call verifyEmail with the secret from the logs
//
//        System.out.println("\n=== Testing Signup with Retries ===");
//        User user6 = new User("Diana Prince", "diana@mail.com");
//        WorkflowResult result6 = RetriesWorkflowClient
//            .fromClient(restateClient, "user-128")
//            .run(user6)
//            .await();
//        System.out.println("Result: " + result6.success);
//
//        System.out.println("\n=== Testing Signup with Sagas ===");
//        User user7 = new User("Eve Adams", "eve@mail.com");
//        WorkflowResult result7 = SagasWorkflowClient
//            .fromClient(restateClient, "user-129")
//            .run(user7)
//            .await();
//        System.out.println("Result: " + result7.success);
//
//        restateClient.close();
//    }
// }
