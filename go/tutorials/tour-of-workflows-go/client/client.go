//package main
//
//import (
//	"context"
//	"fmt"
//	"log"
//	"time"
//
//	restateingress "github.com/restatedev/sdk-go/ingress"
//)
//
//func main() {
//	restateClient := restateingress.NewClient("http://localhost:8080")
//	defer restateClient.Close()
//
//	fmt.Println("=== Testing Basic Signup Workflow ===")
//	user1 := User{Name: "John Doe", Email: "john@mail.com"}
//	result1, err := restateingress.Workflow[User, bool](
//		restateClient, "GetStartedWorkflow", "user-123", "Run").
//		Request(context.Background(), user1)
//	if err != nil {
//		log.Printf("Error: %v", err)
//	} else {
//		fmt.Printf("Result: %t\n", result1.Success)
//	}
//
//	fmt.Println("\n=== Testing Signup with Activities ===")
//	user2 := User{Name: "Jane Smith", Email: "jane@mail.com"}
//	result2, err := restateingress.Workflow[User, bool](
//		restateClient, "ActivitiesWorkflow", "user-124", "Run").
//		Request(context.Background(), user2)
//	if err != nil {
//		log.Printf("Error: %v", err)
//	} else {
//		fmt.Printf("Result: %t\n", result2.Success)
//	}
//
//	fmt.Println("\n=== Testing Signup with Queries ===")
//	user3 := User{Name: "Bob Wilson", Email: "bob@mail.com"}
//	// Submit workflow asynchronously
//	err = restateingress.WorkflowSend[User](
//		restateClient, "QueriesWorkflow", "user-125", "Run").
//		Send(context.Background(), user3)
//	if err != nil {
//		log.Printf("Error: %v", err)
//	}
//
//	time.Sleep(1 * time.Second) // Give workflow time to start
//
//	// Query status
//	status, err := restateingress.Workflow[struct{}, StatusResponse](
//		restateClient, "QueriesWorkflow", "user-125", "GetStatus").
//		Request(context.Background(), struct{}{})
//	if err != nil {
//		log.Printf("Error: %v", err)
//	} else {
//		if status.Status != nil {
//			fmt.Printf("Status: %s\n", *status.Status)
//		} else {
//			fmt.Println("Status: nil")
//		}
//	}
//
//	fmt.Println("\n=== Testing Signup with Events ===")
//	user4 := User{Name: "Alice Johnson", Email: "alice@mail.com"}
//	err = restateingress.WorkflowSend[User](
//		restateClient, "EventsWorkflow", "user-126", "Run").
//		Send(context.Background(), user4)
//	if err != nil {
//		log.Printf("Error: %v", err)
//	}
//
//	fmt.Println("\n=== Testing Signup with Signals ===")
//	user5 := User{Name: "Charlie Brown", Email: "charlie@mail.com"}
//	err = restateingress.WorkflowSend[User](
//		restateClient, "SignalsWorkflow", "user-127", "Run").
//		Send(context.Background(), user5)
//	if err != nil {
//		log.Printf("Error: %v", err)
//	}
//	// To complete this, you would need to call VerifyEmail with the secret from the logs
//
//	fmt.Println("\n=== Testing Signup with Retries ===")
//	user6 := User{Name: "Diana Prince", Email: "diana@mail.com"}
//	result6, err := restateingress.Workflow[User, bool](
//		restateClient, "RetriesWorkflow", "user-128", "Run").
//		Request(context.Background(), user6)
//	if err != nil {
//		log.Printf("Error: %v", err)
//	} else {
//		fmt.Printf("Result: %t\n", result6.Success)
//	}
//
//	fmt.Println("\n=== Testing Signup with Sagas ===")
//	user7 := User{Name: "Eve Adams", Email: "eve@mail.com"}
//	result7, err := restateingress.Workflow[User, bool](
//		restateClient, "SagasWorkflow", "user-129", "Run").
//		Request(context.Background(), user7)
//	if err != nil {
//		log.Printf("Error: %v", err)
//	} else {
//		fmt.Printf("Result: %t\n", result7.Success)
//	}
//
//	fmt.Println("\n=== Testing Signup with Timers ===")
//	user8 := User{Name: "Frank Miller", Email: "frank@mail.com"}
//	err = restateingress.WorkflowSend[User](
//		restateClient, "TimersWorkflow", "user-130", "Run").
//		Send(context.Background(), user8)
//	if err != nil {
//		log.Printf("Error: %v", err)
//	}
//	// To complete this, you would need to call VerifyEmail with the secret from the logs
//}
