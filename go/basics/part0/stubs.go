package main

import (
	"fmt"
	"math/rand"
)

func MaybeCrash(probability float32) error {
	if rand.Float32() < probability { // 50% chance of failure
		fmt.Printf("👻 A failure happened!")
		return fmt.Errorf("a failure happened")
	}
	return nil
}

// CreateSubscription Simulates calling a subscription API, with a random probability of API downtime.
func CreateSubscription(userID, subscription, paymentRef string) error {
	err := MaybeCrash(0.3)
	if err != nil {
		return err
	}
	fmt.Printf(">>> Creating subscription %s for user %s\n", subscription, userID)
	return nil
}

// CreateRecurringPayment Simulates calling a payment API, with a random probability of API downtime.
func CreateRecurringPayment(creditCard string, paymentID interface{}) (string, error) {
	err := MaybeCrash(0.3)
	if err != nil {
		return "", err
	}
	fmt.Printf(">>> Creating recurring payment %v\n", paymentID)
	return "payment-reference", nil
}
