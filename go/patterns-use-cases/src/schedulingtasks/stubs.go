package main

import "log/slog"

type StripeEvent struct {
	ID      string `json:"id"`
	Type    string `json:"type"`
	Created int64  `json:"created"`
	Data    struct {
		Object struct {
			ID       string `json:"id"`
			Customer string `json:"customer"`
		} `json:"object"`
	} `json:"data"`
}

func sendEmail(message string) error {
	// Implement the email sending logic here
	slog.Info("Sending email: " + message)
	return nil
}
