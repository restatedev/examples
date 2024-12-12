package auxiliary

import "log/slog"

type EmailClient struct{}

func (EmailClient) NotifyUserOfPaymentSuccess(userId string) (bool, error) {
	slog.Info("Notifying user of payment success", "userId", userId)
	// send the email
	return true, nil
}

func (EmailClient) NotifyUserOfPaymentFailure(userId string) (bool, error) {
	slog.Info("Notifying user of payment failure", "userId", userId)
	// send the email
	return true, nil
}
