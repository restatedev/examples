package main

import (
	"fmt"
	restate "github.com/restatedev/sdk-go"
	"math/rand"
)

func SendNotification(greetingId string, name string) (restate.Void, error) {
	if rand.Float32() < 0.7 && name == "Alice" { // 70% chance of failure
		fmt.Printf("[👻 SIMULATED] Failed to send notification: %s - %s\n", greetingId, name)
		return restate.Void{}, fmt.Errorf("[👻 SIMULATED] Failed to send notification: %s - %s", greetingId, name)
	}
	fmt.Printf("Notification sent: %s - %s\n", greetingId, name)
	return restate.Void{}, nil
}

func SendReminder(greetingId string, name string) (restate.Void, error) {
	if rand.Float32() < 0.7 && name == "Alice" { // 70% chance of failure
		fmt.Printf("[👻 SIMULATED] Failed to send reminder: %s\n", greetingId)
		return restate.Void{}, fmt.Errorf(" [👻 SIMULATED] Failed to send reminder: %s", greetingId)
	}
	fmt.Printf("Reminder sent: %s\n", greetingId)
	return restate.Void{}, nil
}
