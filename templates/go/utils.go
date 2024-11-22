package main

import (
	"fmt"
	"math/rand"
)

func SendNotification(greetingId string, name string) error {
	if rand.Float32() < 0.5 { // 50% chance of failure
		fmt.Printf("👻 Failed to send notification: %s - %s\n", greetingId, name)
		return fmt.Errorf("failed to send notification: %s - %s", greetingId, name)
	}
	fmt.Printf("Notification sent: %s - %s\n", greetingId, name)
	return nil
}

func SendReminder(greetingId string) error {
	if rand.Float32() < 0.5 { // 50% chance of failure
		fmt.Printf("👻 Failed to send reminder: %s\n", greetingId)
		return fmt.Errorf("failed to send reminder: %s", greetingId)
	}
	fmt.Printf("Reminder sent: %s\n", greetingId)
	return nil
}
