package examples

import (
	"fmt"
	"log"

	restate "github.com/restatedev/sdk-go"
)

// User represents a user with name and email
type User struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// CreateUserRequest represents a request to create a user
type CreateUserRequest struct {
	UserID string `json:"userId"`
	User   User   `json:"user"`
}

// VerifyEmailRequest represents a request to verify email
type VerifyEmailRequest struct {
	Secret string `json:"secret"`
}

type EmailServiceResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type StatusResponse struct {
	Status *string `json:"status"`
	User   *User   `json:"user"`
}

// <start_here>
func SendWelcomeEmail(user User) error {
	err := failOnAlice(user.Name, "send welcome email")
	if err != nil {
		return err
	}
	fmt.Printf("Welcome email sent: %s\n", user.Email)
	return nil
}

// <end_here>

func failOnAlice(name, action string) error {
	if name == "Alice" {
		msg := fmt.Sprintf("[👻 SIMULATED] Failed to %s: %s", action, name)
		log.Println(msg)
		return fmt.Errorf(msg)
	}
	return nil
}

func terminalErrorOnAlice(name, action string) error {
	if name == "Alice" {
		msg := fmt.Sprintf("[👻 SIMULATED] Failed to %s for %s: not available in this country", action, name)
		log.Println(msg)
		return restate.TerminalError(fmt.Errorf(msg))
	}
	return nil
}

func CreateUser(userID string, user User) (bool, error) {
	fmt.Printf("User entry created in DB: %s\n", userID)
	return true, nil
}

func DeleteUser(userID string) error {
	fmt.Printf("User entry deleted in DB: %s\n", userID)
	return nil
}

func SendVerificationEmail(userID string, user User, verificationSecret string) error {
	fmt.Printf("Verification email sent: %s\n", user.Email)
	fmt.Printf("For the signals section, verify via: curl localhost:8080/SignupWithSignalsWorkflow/%s/VerifyEmail --json '{\"secret\": \"%s\"}'\n", userID, verificationSecret)
	fmt.Printf("For the timers section, verify via: curl localhost:8080/SignupWithTimersWorkflow/%s/VerifyEmail --json '{\"secret\": \"%s\"}'\n", userID, verificationSecret)
	return nil
}

func SendReminderEmail(userID string, user User, verificationSecret string) error {
	fmt.Printf("Reminder email sent: %s\n", user.Email)
	fmt.Printf("For the timers section, verify via: curl localhost:8080/SignupWithTimersWorkflow/%s/VerifyEmail --json '{\"secret\": \"%s\"}'\n", userID, verificationSecret)
	return nil
}

func ActivateUser(userID string) error {
	fmt.Printf("User account activated: %s\n", userID)
	return nil
}

func DeactivateUser(userID string) error {
	fmt.Printf("User account deactivated: %s\n", userID)
	return nil
}

func SubscribeToPaidPlan(user User) (bool, error) {
	err := terminalErrorOnAlice(user.Name, "subscribe to paid plan")
	if err != nil {
		return false, err
	}
	fmt.Printf("User subscribed to paid plan: %s\n", user.Name)
	return true, nil
}

func CancelSubscription(user User) error {
	fmt.Printf("User subscription cancelled: %s\n", user.Name)
	return nil
}

// EmailService represents the email service
type EmailService struct{}

func (EmailService) SendWelcome(ctx restate.Context, user User) (EmailServiceResponse, error) {
	_, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return restate.Void{}, SendWelcomeEmail(user)
	})
	if err != nil {
		return EmailServiceResponse{}, err
	}

	return EmailServiceResponse{
		Success: true,
		Message: "Email sent successfully",
	}, nil
}

// UserService represents the user service
type UserService struct{}

func (UserService) CreateUser(ctx restate.Context, req CreateUserRequest) (bool, error) {
	return restate.Run(ctx, func(ctx restate.RunContext) (bool, error) {
		return CreateUser(req.UserID, req.User)
	})
}
