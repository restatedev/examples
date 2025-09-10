package main

import (
	"context"
	"fmt"
	"log"

	utils "github.com/restatedev/examples/go/tutorials/tour-of-workflows-go/examples"
	restateingress "github.com/restatedev/sdk-go/ingress"
)

func main() {
	user := utils.User{Name: "John Doe", Email: "john@mail.com"}
	// <start_submit>
	restateClient := restateingress.NewClient("http://localhost:8080")
	result, err := restateingress.Workflow[utils.User, bool](
		restateClient, "SignupWorkflow", "user-123", "Run").
		Request(context.Background(), user)
	// <end_submit>
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		fmt.Printf("Result: %t\n", result)
	}
}
