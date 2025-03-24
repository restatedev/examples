package main

import "log/slog"

type StripeEvent struct {
	ID      string `json:"id"`
	Type    string `json:"type"`
	Created int64  `json:"created"`
	Data    struct {
		ID       string `json:"id"`
		Customer string `json:"customer"`
	} `json:"data"`
}

func SendReminderEmail(event StripeEvent) error {
	slog.Info("Sending reminder email for event " + event.Data.ID)
	return nil
}

func EscalateToHuman(event StripeEvent) error {
	slog.Info("Escalating to human for event " + event.Data.ID)
	return nil
}
